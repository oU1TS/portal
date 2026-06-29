# Chat Conversation

Note: _This is purely the output of the chat conversation and does not contain any raw data, codebase snippets, etc. used to generate the output._

### User Input

make the recent submission button fetch updates from the google sheet when it is clicked in @[e:\Git_WIP\2. Personal Repositories\ou1ts.portal\contributions.html] 

*Viewed [contributions.html](ou1ts.portal/contributions.html) *

*Viewed [contributions.html](ou1ts.portal/contributions.html) *

*Edited relevant file*

*Viewed [contributions.html](ou1ts.portal/contributions.html) *

*Viewed [contributions.html](ou1ts.portal/contributions.html) *

*Edited relevant file*

*Analyzed [community.html](ou1ts.portal/community.html) *

*User accepted the command `echo done`*

### Planner Response

I've modified [contributions.html](cci:7://ou1ts.portal/contributions.html:0:0-0:0) so that clicking the "Recent Submissions" button will proactively fetch any updates from the Google Sheet. 

Here's exactly what was done:
1. **Fetch Latest Data on Click**: Re-purposed the [showRecentSubmissions()](cci:1://ou1ts.portal/contributions.html:1055:8-1110:9) function to be `async` and trigger `await fetchContributors()` before sorting and showing the list, confirming that the information is truly up-to-date right as you click the button.
2. **Added Loading UI**: While the new fetch request is actively pulling data in the background, a neat little loading indicator will seamlessly display inside the "Recent Submissions" panel. If a network chunk fails, it handles the error gracefully!
3. **Prevented Duplicates**: I updated [fetchContributors()](cci:1://ou1ts.portal/contributions.html:736:8-838:9) to clear out the `chronologicalSubmissions` array (`chronologicalSubmissions = []`) first every time it pulls formatting. This is to ensure you won't see the same contributions awkwardly duplicating every time the table grabs new details.