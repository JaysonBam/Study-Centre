# Performance checks

Run `npm run test:performance` from the repository root. The suite bundles the real API code with synthetic service responses and checks cache freshness, concurrent reads, Gmail thread membership and workflow data preservation. It never calls hosted services.

Production captures, benchmark exports and correspondence are private operational artifacts. Do not commit them. The optional `?perf=1` diagnostic mode is for approved local investigation; do not share captured data without review.
