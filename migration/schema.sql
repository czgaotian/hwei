-- =========================
-- categories（文章分类）
-- =========================
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- tags（标签）
-- =========================
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- media（图片 / 视频 / 音频）
-- =========================
CREATE TABLE media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  type TEXT NOT NULL
    CHECK (type IN ('image','video','audio')),

  r2_key TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  mime_type TEXT,
  size INTEGER,

  width INTEGER,
  height INTEGER,
  duration INTEGER,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- posts（文章）
-- =========================
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT, 
  content TEXT NOT NULL,

  category_id INTEGER NOT NULL,
  cover_media_id INTEGER, 

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (category_id)
    REFERENCES categories(id)
    ON DELETE RESTRICT,

  FOREIGN KEY (cover_media_id)
    REFERENCES media(id)
);

-- =========================
-- post_tags（文章-标签 多对多）
-- =========================
CREATE TABLE post_tags (
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,

  PRIMARY KEY (post_id, tag_id),

  FOREIGN KEY (post_id)
    REFERENCES posts(id)
    ON DELETE CASCADE,

  FOREIGN KEY (tag_id)
    REFERENCES tags(id)
    ON DELETE CASCADE
);

-- =========================
-- post_media（文章-媒体 多对多）
-- =========================
CREATE TABLE post_media (
  post_id INTEGER NOT NULL,
  media_id INTEGER NOT NULL,
  purpose TEXT CHECK(purpose IN ('cover','content','attachment')),

  PRIMARY KEY (post_id, media_id),

  FOREIGN KEY (post_id)
    REFERENCES posts(id)
    ON DELETE CASCADE,

  FOREIGN KEY (media_id)
    REFERENCES media(id)
    ON DELETE CASCADE
);

-- =========================
-- indexes（性能优化）
-- =========================
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_status ON posts(status);

CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);

CREATE INDEX idx_post_media_post_id ON post_media(post_id);
CREATE INDEX idx_post_media_media_id ON post_media(media_id);
