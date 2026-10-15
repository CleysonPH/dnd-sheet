ALTER TABLE "sheet" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "sheet" ADD CONSTRAINT "sheet_share_token_unique" UNIQUE("share_token");