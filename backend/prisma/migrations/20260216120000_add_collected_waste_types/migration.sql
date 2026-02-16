-- Track collected waste types per address in route
ALTER TABLE RouteAddress ADD COLUMN collectedWasteTypes JSON NULL;
