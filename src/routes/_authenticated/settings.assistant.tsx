import { createFileRoute } from "@tanstack/react-router";
import { AssistantSettingsPage } from "@/components/assistant-settings-page";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/_authenticated/settings/assistant")({
  head: () =>
    pageHead("AI Assistant Settings", "Review the business knowledge used in customer replies."),
  component: AssistantSettingsPage,
});
