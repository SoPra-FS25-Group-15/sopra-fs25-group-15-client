# Contributions

Every member has to complete at least 2 meaningful tasks per week, where a
single development task should have a granularity of 0.5-1 day. The completed
tasks have to be shown in the weekly TA meetings. You have one "Joker" to miss
one weekly TA meeting and another "Joker" to once skip continuous progress over
the remaining weeks of the course. Please note that you cannot make up for
"missed" continuous progress, but you can "work ahead" by completing twice the
amount of work in one week to skip progress on a subsequent week without using
your "Joker". Please communicate your planning **ahead of time**.

Note: If a team member fails to show continuous progress after using their
Joker, they will individually fail the overall course (unless there is a valid
reason).

**You MUST**:

- Have two meaningful contributions per week.

**You CAN**:

- Have more than one commit per contribution.
- Have more than two contributions per week.
- Link issues to contributions descriptions for better traceability.

**You CANNOT**:

- Link the same commit more than once.
- Use a commit authored by another GitHub user.

---

## Contributions Week 1 - [27.3.2025] to [3.4.2025]

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **@froeoe** | 26.3.2025   | [#109](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-client/pull/109) | This pull request contains all the commits related to the creation of the Register page. | This enables the user to register, which is a crucial functionality. |
|                    | 26.3.2025   | [#112](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-client/pull/112) | This pull request contains all the commits related to the creation of the Game Rule page. | The user is now able to view the game rules. |
|                    | 29.3.2025   | [#117](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-client/pull/117) | This pull request contains all the commits related to creation of the friend component. | This enables the user to add, view, accept and manage their friends. |
| **DaryaTereshchenko** | 30.3.2025   | [d00ae19](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/pull/261/commits/d00ae19a0a49083225bee82fa9fc713d51b038f3)| Added the Status controller and corresponding DTO to the backend. [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/262) | The endpoints return public statistics of a user and private statistics of an authenticated user.
|                    | 30.3.2025   | [402f4cc](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/pull/261/commits/402f4cc42e043d13a71f538ccf74c5110c053dff) | Added endpoints for user update. [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/53), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/58), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/54) | Relevant for user update game logic and frontend implementation. |
|                    | 30.3.2025   | [b1cdaf9](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/pull/261/commits/b1cdaf9367a17f795e6930652069dba7130f6ea4) | Added Integration tests for the logic from the user stories 1, partially 4, and 3. [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/47), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/57), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/27) | Relevant to validate that the endpoints work correctly and the DTOs are according to the specifications. |
|                    | 31.3.2025   | [3c03cb6](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/pull/263/commits/3c03cb645b62b7125a88c72fec9f8e915c9377bc) | Added constants for lobby creation. [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/250),[Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/252), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/253), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/254), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/255), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/258) | Relevant for lobby creation. |
|                    | 31.3.2025   | [1668d7f](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/pull/263/commits/1668d7f76565aa28a8910a58ed4895b20621f1f3) | Added LobbyController with the described endpoints in [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/250), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/252), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/253), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/254), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/255), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/256), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/258) and Lobby entity [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/259) | Implements different types of lobbies and game modes (ranked/unranked). Relevant for the frontend to work on the lobby interface, and to start further developing action and round cards on the backend side as well as in-game friends notifications. |
|                    | 31.3.2025   | [ddf4a96](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/pull/263/commits/ddf4a966feb9c6fc4017c7842f3e332544eca9ea) |Added Lobby repository for [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/259) | Relevant for the frontend to work on the lobby interface, and to start further developing action and round cards on the backend side as well as in-game friends notifications. |
|                    | 31.3.2025   | [df068e1](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/pull/263/commits/df068e1f5f84b8633117414f0ad7d3d053957c2b) | Added necessary DTOs and updated the DTO mapper according to the [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/250), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/252), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/253), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/254), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/255), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/256), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/258) | Relevant for the frontend to work on the lobby interface, and to start further developing action and round cards on the backend side as well as in-game friends notifications. |
|                    | 31.3.2025   | [69b1730](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/pull/263/commits/69b173090860a48f0790328f19f46d34e17050cd) | Added the LobbyService with logic implementation for the endpoints: [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/250), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/252), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/253), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/254), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/255), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/256), [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/258)  | Relevant for the frontend to work on the lobby interface, and to start further developing action and round cards on the backend side as well as in-game friends notifications. |
|                    | 31.3.2025   | [49fd90f](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/pull/263/commits/49fd90f927c60c089650ffc9d18344253794fb55) | Added the integration JUnit tests for all endpoints in controller, mapper, repository, and service. Updated the User integration tests to be consistent with the lobby logic. [Task](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/issues/260)   |Integration tests for the created lobby endpoints to validate the correct logic and necessary DTOs. |
|                    | 01.04.2025   | [PR #263](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/pull/263) | The PR closes the tasks connected with lobby endpoints, and provides further overview on commits that fix issues and updates.| Further overview of commits is relevant to trace the change in the logic of leave and update-endpoints as well as see what parts of the M2 feedback are incorporated already in the code. |
| **zhenmei**        | 01.04.2025   | [c5f1daca](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/commit/c5f1daca36cfff1792cff5ac18337a82adfeafc7) [bad86a9](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/commit/bad86a9c1be442287bc125ad2cb1001331f70cfe) [ffcabe5](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/commit/ffcabe548f05faeca815a80fbc8979d854dde69a) [c61e6a5](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/commit/c61e6a5d4e179fd86d16b94e75bd07bb4e4058d8) [9a48098](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/commit/9a48098d532fc098e36a43d068057633b4ced091) [8e2dc8a](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/commit/8e2dc8a029774f776e7051c88ee8bcfec0db51e0) [9a48098](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/commit/9a48098d532fc098e36a43d068057633b4ced091)| Develop feature to send invitations, process acceptances or rejections, and update the friends list. Implement a notification system to alert users when an invitation is accepted or rejected. Persist invitation details, pending status, and final friend connection statuses in the database to ensure accurate updates, and correct DB schemas persistence. Added friendship management to get friend list info and delete friend| User story 06: Added functions about adding friends and managing friendship|
|                    | 02.04.2025   | [10f71f4](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/commit/10f71f4e70bd1e6e19fbb24b9e4925c016cd5de5) [622cac1](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/commit/622cac104e5882c2c59fa84662f362c6cc53a330) [b4a9166](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-server/commit/b4a91668e18bdf9d60a59623e45f80a6448970d9)| Added tests for friend controller, friend repo and friend service| User story 06: Validate the end-to-end process from sending an invitation to updating the friends list and notifications. Validate end-to-end functionality for statistics display, auto-refresh, and persistence.|
| **@julienzb** | 26.3.2025  | [PR #105](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-client/pull/105) / [C1](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-client/pull/105/commits/bf8fcc68e0a6b1144aba4d4d02f47827e4638bae)  | Implemented the login page | Allows the user to log in with their credentials |
|                    | 29.3.2025   | [PR #118](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-client/pull/118) / [C1](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-client/pull/118/commits/0d27401af16f5a5cdc47e031c2b7c59f72779b39) / [C2](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-client/pull/118/commits/08f0b973722c53e52203bc19dc0e1f51631d40be) | Added Header, Menu and UserCard | Implemented a header and menu component for the user to be able to navigate the site. Further implements a UserCard component that shows user details to communicate that the login was successful or a login and sign up button for their respective actions |
|                    | 31.3.2025   | [PR #120](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-client/pull/120) / [C1](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-client/pull/120/commits/bdee5fe4a3cf30a80ccd9014ecd7220fe8631f09) | The menu now uses the link component | Provides a better user experience due to faster navigation and properly uses next.js capabilities (ex. prefetching) |
|                    | 02.4.2025   | [PR #121](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-client/pull/121) / [C1](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-client/pull/121/commits/d4e07bcbd775bf76b0daf43c4d99af4ad0077e8d) | Added a globalUser context so that changes to the user object are reflected in all components | The UserCard component now correctly changes its content based on if the user is logged in |
| **@TongxiHu** | 03.04.2025   | [05ae626](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-client/pull/123/commits/05ae626c2e1ce2bc039c86b97aeafc2894b77a10) | Created the user profile interface which is accessible only to logged-in users. | Users can view both their own information and other users' profiles.
|                    | 03.04.2025    | [30816df](https://github.com/SoPra-FS25-Group-15/sopra-fs25-group-15-client/pull/123/commits/30816df048abfcf3c06623c0e2007582fd255969) | Developed a user profile update interface that is accessible only to logged-in users and implemented the update functionality. | User story 04: As a user, I want to edit my profile information like my username, password and e-mail. I should also be able to delete my account. |
| **[@githubUser6]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |

---

## Contributions Week 2 - [Begin Date] to [End Date]

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **[@githubUser1]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser2]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser3]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser4]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser5]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser6]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |

---

## Contributions Week 3 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 4 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 5 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 6 - [Begin Date] to [End Date]

_Continue with the same table format as above._
