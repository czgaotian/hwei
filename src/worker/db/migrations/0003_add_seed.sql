INSERT OR IGNORE INTO languages (lang, locale, is_default)
VALUES ('zh-CN', '简体中文', 1);
--> statement-breakpoint

INSERT OR IGNORE INTO languages (lang, locale, is_default)
VALUES ('en', 'English', 0);
--> statement-breakpoint