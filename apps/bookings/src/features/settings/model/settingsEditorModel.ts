export type RoomRow = {
  id: number;
  name: string;
  max_people: number | null;
  min_people: number | null;
  borrowable_items?: string[] | null;
  dynamic_labels?: string[] | null;
  is_available?: boolean | null;
};

export type CourseRow = {
  id: number;
  name: string;
  color_hex?: string | null;
};
