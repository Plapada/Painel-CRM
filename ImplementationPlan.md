# Implementation Plan - Synchronous Summary Update

## Goal
Update the summary generation logic to handle a direct response from the webhook, removing the artificial 5-second delay.

## Proposed Changes

### [MODIFY] [src/app/(authenticated)/clients/[id]/page.tsx]
-   **Logic**:
    -   In `handleSummarizeConversation`:
        -   Remove `setTimeout`.
        -   Check `response.ok`.
        -   The webhook now returns the summary text.
        -   Update the client state with this new summary: `setClient(prev => ({ ...prev, resumo_conversa: newSummary }))`.

### [MODIFY] [src/app/(authenticated)/chat/page.tsx]
-   **Logic**:
    -   Update `handleSummarizeConversation` (for message panel) and `handlePopoverSummarize` similarly.
    -   Use the response data to update the UI immediately.

## Verification Plan
-   Mock the webhook response returns a string "Resumo atualizado...".
-   Verify the UI updates immediately without the 5s loading spin.
