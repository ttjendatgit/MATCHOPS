using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MATCHOP.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAIConversation : Migration
    {
        /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Add ConversationId column only if it doesn't exist
        migrationBuilder.Sql(@"
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'AIChatMessages' 
                    AND column_name = 'ConversationId'
                ) THEN
                    ALTER TABLE ""AIChatMessages"" ADD ""ConversationId"" uuid;
                END IF;
            END $$;
        ");

        // Create AIConversations table only if it doesn't exist
        migrationBuilder.Sql(@"
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_name = 'AIConversations'
                ) THEN
                    CREATE TABLE ""AIConversations"" (
                        ""Id"" uuid NOT NULL DEFAULT gen_random_uuid(),
                        ""UserId"" uuid NOT NULL,
                        ""Title"" character varying(200) NOT NULL,
                        ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                        ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                        CONSTRAINT ""PK_AIConversations"" PRIMARY KEY (""Id""),
                        CONSTRAINT ""FK_AIConversations_Users_UserId"" FOREIGN KEY (""UserId"")
                            REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
                    );
                END IF;
            END $$;
        ");

        // Create index on AIChatMessages.ConversationId only if it doesn't exist
        migrationBuilder.Sql(@"
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE tablename = 'AIChatMessages' 
                    AND indexname = 'ix_ai_chat_messages_conversation'
                ) THEN
                    CREATE INDEX ""ix_ai_chat_messages_conversation"" ON ""AIChatMessages"" (""ConversationId"");
                END IF;
            END $$;
        ");

        // Create index on AIConversations.UserId only if it doesn't exist
        migrationBuilder.Sql(@"
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE tablename = 'AIConversations' 
                    AND indexname = 'ix_ai_conversations_user'
                ) THEN
                    CREATE INDEX ""ix_ai_conversations_user"" ON ""AIConversations"" (""UserId"");
                END IF;
            END $$;
        ");

        // Add foreign key from AIChatMessages to AIConversations only if it doesn't exist
        migrationBuilder.Sql(@"
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE table_name = 'AIChatMessages' 
                    AND constraint_name = 'FK_AIChatMessages_AIConversations_ConversationId'
                ) THEN
                    ALTER TABLE ""AIChatMessages"" 
                    ADD CONSTRAINT ""FK_AIChatMessages_AIConversations_ConversationId"" 
                    FOREIGN KEY (""ConversationId"") REFERENCES ""AIConversations"" (""Id"") ON DELETE CASCADE;
                END IF;
            END $$;
        ");
    }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AIChatMessages_AIConversations_ConversationId",
                table: "AIChatMessages");

            migrationBuilder.DropTable(
                name: "AIConversations");

            migrationBuilder.DropIndex(
                name: "ix_ai_chat_messages_conversation",
                table: "AIChatMessages");

            migrationBuilder.DropColumn(
                name: "ConversationId",
                table: "AIChatMessages");
        }
    }
}
