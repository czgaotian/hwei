CREATE TRIGGER trigger_update_categories_updated_at
AFTER UPDATE ON categories
FOR EACH ROW
BEGIN
  UPDATE categories
  SET updated_at = strftime('%s','now')
  WHERE id = OLD.id;
END;

CREATE TRIGGER trigger_update_tags_updated_at
AFTER UPDATE ON tags
FOR EACH ROW
BEGIN
  UPDATE tags
  SET updated_at = strftime('%s','now')
  WHERE id = OLD.id;
END;

CREATE TRIGGER trigger_update_posts_updated_at
AFTER UPDATE ON posts
FOR EACH ROW
BEGIN
  UPDATE posts
  SET updated_at = strftime('%s','now')
  WHERE id = OLD.id;
END;

