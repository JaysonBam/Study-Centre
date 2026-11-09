import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // 0. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Parse Date
    const url = new URL(req.url);
    let date = url.searchParams.get("date");

    if (!date) {
      const body = await req.json().catch(() => null);
      date = body?.date;
    }

    if (!date) {
      return new Response(
        JSON.stringify({ message: "Missing required parameter: date (YYYY-MM-DD)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response(
        JSON.stringify({ message: "Invalid date format. Use YYYY-MM-DD" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 2. Definitions
    const mins = [2, 4, 6];
    const labelMap: Record<string, string> = {
      "2": "open room",
      "4": "closed room",
      "6": "boardroom",
    };

    // 3. Fetch Settings (JSON stored as STRING)
    const settingsRes = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["operation_hours", "saturday_hours"]);

    if (settingsRes.error) throw settingsRes.error;

    // Defaults
    let operation_hours = { start: "07:00", end: "18:00" };
    let saturday_hours = { enabled: false, start: "08:00", end: "12:00" };

    settingsRes.data.forEach((row: any) => {
      try {
        const parsed =
          typeof row.value === "string" ? JSON.parse(row.value) : row.value;

        if (row.key === "operation_hours") {
          operation_hours = parsed;
        }

        if (row.key === "saturday_hours") {
          saturday_hours = parsed;
        }
      } catch {
        // fallback to defaults
      }
    });

    // 4. Determine applicable hours
    const dayOfWeek = new Date(date + "T00:00:00").getDay(); // 0=Sun, 6=Sat

    if (dayOfWeek === 6) {
      if (!saturday_hours.enabled) {
        return new Response(
          JSON.stringify({ message: "Closed on Saturdays" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Temporarily override operation_hours for calculation logic, 
      // but we will return the specific saturday_hours object in the response below
      operation_hours = {
        start: saturday_hours.start,
        end: saturday_hours.end,
      };
    }

    // Helpers
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const toTime = (minsTotal: number) => {
      const hh = Math.floor(minsTotal / 60);
      const mm = minsTotal % 60;
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    };

    const startOfDay = toMinutes(operation_hours.start);
    const endOfDay = toMinutes(operation_hours.end);

    if (endOfDay <= startOfDay) {
      throw new Error("Invalid operation hours");
    }

    // 5. Fetch Rooms
    const roomsRes = await supabase
      .from("rooms")
      .select("id, min_people")
      .in("min_people", mins)
      .eq("is_available", true);

    if (roomsRes.error) throw roomsRes.error;

    const roomsByType: Record<string, number[]> = {};
    const roomIdToType: Record<number, string> = {};
    const allRoomIds: number[] = [];

    mins.forEach((m) => (roomsByType[labelMap[String(m)]] = []));

    roomsRes.data.forEach((r: any) => {
      const label = labelMap[String(r.min_people)];
      roomsByType[label].push(r.id);
      roomIdToType[r.id] = label;
      allRoomIds.push(r.id);
    });

    const totals: Record<string, number> = {};
    Object.entries(roomsByType).forEach(([label, ids]) => (totals[label] = ids.length));

    // 6. Fetch Bookings (ADDED: state column)
    const bookingsRes = await supabase
      .from("bookings")
      .select("room_id, start_time, end_time, state")
      .eq("booking_day", date)
      .in("room_id", allRoomIds);

    if (bookingsRes.error) throw bookingsRes.error;

    // ADDED: Track state in the blocked ranges map
    const blockedRanges: Record<number, { start: number; end: number; state: string }[]> = {};

    bookingsRes.data.forEach((b: any) => {
      if (!blockedRanges[b.room_id]) blockedRanges[b.room_id] = [];
      blockedRanges[b.room_id].push({
        start: toMinutes(b.start_time),
        end: toMinutes(b.end_time),
        state: b.state, 
      });
    });

    // NEW LOGIC: Instead of a simple boolean, return the slot's specific status
    const getSlotStatus = (roomId: number, s: number, e: number) => {
      if (s < startOfDay || e > endOfDay) return "Blocked";
      
      const overlaps = (blockedRanges[roomId] || []).filter((r) => s < r.end && e > r.start);
      
      if (overlaps.length === 0) return "Free";
      // If any of the overlapping bookings are NOT ended, the slot is truly blocked
      if (overlaps.some((r) => r.state !== "Ended")) return "Blocked";
      
      return "Ended";
    };

    // 7. Build Grid
    const grid = [];

    for (let t = startOfDay; t < endOfDay; t += 30) {
      const availability: Record<
        string,
        { "120": number; "90": number; "60": number; "30": number }
      > = {};

      Object.keys(totals).forEach(
        (label) => (availability[label] = { "120": 0, "90": 0, "60": 0, "30": 0 })
      );

      for (const roomId of allRoomIds) {
        const type = roomIdToType[roomId];
        let free = 0;

        const currentStatus = getSlotStatus(roomId, t, t + 30);

        if (currentStatus === "Free") {
          // Standard Counting Logic
          free = 30;
          if (getSlotStatus(roomId, t + 30, t + 60) === "Free") {
            free = 60;
            if (getSlotStatus(roomId, t + 60, t + 90) === "Free") {
              free = 90;
              if (getSlotStatus(roomId, t + 90, t + 120) === "Free") {
                free = 120;
              }
            }
          }
        } else if (currentStatus === "Ended") {
          // PEEK AHEAD LOGIC
          // The current slot is transparent. Count availability starting from the NEXT slot.
          if (getSlotStatus(roomId, t + 30, t + 60) === "Free") {
            free = 30; 
            if (getSlotStatus(roomId, t + 60, t + 90) === "Free") {
              free = 60; 
              if (getSlotStatus(roomId, t + 90, t + 120) === "Free") {
                free = 90; 
                if (getSlotStatus(roomId, t + 120, t + 150) === "Free") {
                  free = 120; 
                }
              }
            }
          }
        }

        // Must be greater than 30 to register as a valid selectable slot.
        // If peek-ahead only found 30 free minutes next door, it will cleanly ignore it.
        if (free > 30) {
          availability[type][free.toString() as "30" | "60" | "90" | "120"]++;
        }
      }

      grid.push({
        start: toTime(t),
        end: toTime(Math.min(t + 30, endOfDay)),
        availability,
      });
    }

    return new Response(
      JSON.stringify({
        operation_hours,
        saturday_hours,
        totals,
        grid,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ message: err?.message ?? String(err) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});