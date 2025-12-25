CREATE TABLE `languages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lang` text NOT NULL,
	`locale` text NOT NULL,
	`is_default` integer DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX `languages_lang_unique` ON `languages` (`lang`);--> statement-breakpoint
CREATE UNIQUE INDEX `languages_locale_unique` ON `languages` (`locale`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`user_id` integer NOT NULL,
	`fresh` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL
);
--> statement-breakpoint
DROP INDEX `categories_name_unique`;--> statement-breakpoint
DROP INDEX `categories_slug_unique`;--> statement-breakpoint
ALTER TABLE `categories` ADD `language_id` integer NOT NULL REFERENCES languages(id);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_language_unique` ON `categories` (`language_id`,`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_language_unique` ON `categories` (`language_id`,`name`);--> statement-breakpoint
DROP INDEX `tags_name_unique`;--> statement-breakpoint
ALTER TABLE `tags` ADD `language_id` integer NOT NULL REFERENCES languages(id);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_language_unique` ON `tags` (`language_id`,`name`);--> statement-breakpoint
ALTER TABLE `posts` ADD `language_id` integer NOT NULL REFERENCES languages(id);