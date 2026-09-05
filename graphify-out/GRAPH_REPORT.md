# Graph Report - Scribo_backend  (2026-09-05)

## Corpus Check
- 141 files · ~31,557 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 969 nodes · 1984 edges · 49 communities (39 shown, 10 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 181 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f27ec405`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- support.service.js
- posts.services.js
- comments.services.js
- analytics.services.js
- profile.services.js
- users.services.js
- categories.services.js
- AppError.js
- auth.routes.js
- session.service.js
- server.js
- verification.service.js
- passwordReset.service.js
- posts.routes.js
- register.service.js
- login.service.js
- logs.services.js
- geo.js
- support.routes.js
- cookies.js
- jwt.js
- dependencies
- auth.middleware.js
- users.routes.js
- comments.routes.js
- Scribo Backend — Blog API Server
- package.json
- db/email.js
- analytics.routes.js
- devDependencies
- defaultRoute.controller.js
- resetPassword
- validate.middleware.js
- scripts
- Schema
- SupportRequest.js
- getSessions.controller.js
- confirmEmailCode
- password.js
- vercel.json
- Session.js
- login_alert.js
- base64url
- bcryptjs
- cors
- dotenv
- eslint.config.js
- mongodb
- nodemailer

## God Nodes (most connected - your core abstractions)
1. `actorFromProfile()` - 25 edges
2. `getUserById()` - 22 edges
3. `getDashboard()` - 22 edges
4. `assertPermission()` - 19 edges
5. `replyToRequest()` - 17 edges
6. `updateRequestStatus()` - 17 edges
7. `getUserByQuery()` - 15 edges
8. `refreshSession()` - 15 edges
9. `replyToPublicRequest()` - 15 edges
10. `issueSession()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `getDashboard()` --calls--> `actorFromProfile()`  [EXTRACTED]
  src/services/analytics.services.js → src/authorization/roleChecks.js
- `createCategory()` --calls--> `actorFromProfile()`  [EXTRACTED]
  src/services/categories.services.js → src/authorization/roleChecks.js
- `deleteCategory()` --calls--> `actorFromProfile()`  [EXTRACTED]
  src/services/categories.services.js → src/authorization/roleChecks.js
- `editCategory()` --calls--> `actorFromProfile()`  [EXTRACTED]
  src/services/categories.services.js → src/authorization/roleChecks.js
- `deleteComment()` --calls--> `actorFromProfile()`  [EXTRACTED]
  src/services/comments.services.js → src/authorization/roleChecks.js

## Import Cycles
- None detected.

## Communities (49 total, 10 thin omitted)

### Community 0 - "support.service.js"
Cohesion: 0.06
Nodes (74): actorFromProfile(), assertPermission(), hasPermissions(), { createRequest }, createSupportRequestController(), { getPublicRequest }, getPublicSupportRequestController(), { getRequest } (+66 more)

### Community 1 - "posts.services.js"
Cohesion: 0.05
Nodes (63): { getComments }, getCommentsController(), { createPost }, createPostController(), { deletePost }, deletePostController(), { editPost }, editPostController() (+55 more)

### Community 2 - "comments.services.js"
Cohesion: 0.06
Nodes (50): assertOwnerOrPermission(), ForbiddenError, getActor(), isResourceOwner(), PERMISSIONS, roleManagement, rolePermissions, ROLES (+42 more)

### Community 3 - "analytics.services.js"
Cohesion: 0.07
Nodes (49): { getDashboard }, getDashboardController(), { trackVisit }, trackVisitController(), activityByType(), Category, countDocumentsSince(), dayKeyExpr() (+41 more)

### Community 4 - "profile.services.js"
Cohesion: 0.06
Nodes (40): { changePassword }, changePasswordController(), { editProfile }, editProfileController(), { getProfile, withAccessRole }, getProfileController(), readNotificationsByUserId(), changePasswordSchema (+32 more)

### Community 5 - "users.services.js"
Cohesion: 0.08
Nodes (39): canManageRole(), { follow }, followController(), { getUserByNickName }, getUserByNickNameController(), { getUsers }, getUsersController(), { unfollow } (+31 more)

### Community 6 - "categories.services.js"
Cohesion: 0.07
Nodes (39): { createCategory }, createCategoryController(), { deleteCategory }, deleteCategoryController(), { editCategory }, editCategoryController(), { getCategories }, getCategoriesController() (+31 more)

### Community 7 - "AppError.js"
Cohesion: 0.06
Nodes (27): getDocs(), getDocsJson, AppError, AppError, BadRequestError, AppError, ConflictError, AppError (+19 more)

### Community 8 - "auth.routes.js"
Cohesion: 0.08
Nodes (31): confirmPasswordResetSchema, forgotPasswordSchema, loginGoogleSchema, loginUsernameSchema, registerEmailSchema, registerGoogleSchema, resetPasswordSchema, verificationEmailConfirmSchema (+23 more)

### Community 9 - "session.service.js"
Cohesion: 0.11
Nodes (27): refreshController(), { refreshSession }, { setRefreshCookie }, createSession(), deleteExpiredSessions(), deleteSessionById(), dropUniqueUserIndex(), getSessionById() (+19 more)

### Community 10 - "server.js"
Cohesion: 0.08
Nodes (22): errorMiddleware(), schema, { Schema, model }, allowedOrigins, app, { awsConfigure }, cors, corsOptions (+14 more)

### Community 11 - "verification.service.js"
Cohesion: 0.12
Nodes (21): { requestVerificationCode }, verificationEmailController(), verificationGoogleController(), { verifyGoogleToken }, createVerificationCode(), AppError, nodemailer, sendEmail() (+13 more)

### Community 12 - "passwordReset.service.js"
Cohesion: 0.11
Nodes (20): { confirmPasswordResetCode }, confirmPasswordResetController(), { requestPasswordReset }, requestPasswordResetController(), upsertPasswordResetCode(), codesMatch(), confirmPasswordResetCode(), crypto (+12 more)

### Community 13 - "posts.routes.js"
Cohesion: 0.08
Nodes (24): commentsSchema, createPostSchema, deletePostSchema, editPostSchema, getPostByIdSchema, getPostsSchema, likePostSchema, savePostSchema (+16 more)

### Community 14 - "register.service.js"
Cohesion: 0.13
Nodes (21): { registerByEmail }, registerByEmailController(), { registerByGoogle }, registerByGoogleController(), editProfileById(), createNewUser(), User, AppError (+13 more)

### Community 15 - "login.service.js"
Cohesion: 0.15
Nodes (20): { issueSession }, { loginByGoogle }, loginByGoogleController(), { setRefreshCookie }, { issueSession }, { loginByUserName }, loginByUsernameController(), { setRefreshCookie } (+12 more)

### Community 16 - "logs.services.js"
Cohesion: 0.16
Nodes (17): { getLogs }, getLogsController(), countLogsByQuery(), getLogsByQuery(), idMatch(), Logs, mongoose, { actorFromProfile, assertPermission } (+9 more)

### Community 17 - "geo.js"
Cohesion: 0.20
Nodes (20): buckets, { clientIp }, consume(), prune(), rateLimit(), TooManyRequestsError, clientGeoHint(), clientIp() (+12 more)

### Community 18 - "support.routes.js"
Cohesion: 0.10
Nodes (20): createSupportRequestSchema, getPublicSupportRequestSchema, getSupportRequestSchema, getSupportRequestsSchema, replyPublicSupportRequestSchema, replySupportRequestSchema, updateSupportRequestStatusSchema, authMiddleware (+12 more)

### Community 19 - "cookies.js"
Cohesion: 0.19
Nodes (15): { clearRefreshCookie }, deleteSessionController(), { revokeSession }, { clearRefreshCookie }, logoutController(), { logoutSession }, getCurrentRefreshPayload(), logoutSession() (+7 more)

### Community 20 - "jwt.js"
Cohesion: 0.20
Nodes (14): { decodeAccess }, optionalAuthMiddleware(), roleManagement, rolePermissions, ROLES, accessKey(), decode(), decodeAccess() (+6 more)

### Community 21 - "dependencies"
Cohesion: 0.13
Nodes (15): aws-sdk, express, googleapis, jsonwebtoken, mongoose, multer, dependencies, aws-sdk (+7 more)

### Community 22 - "auth.middleware.js"
Cohesion: 0.15
Nodes (12): authMiddleware(), { decodeAccess }, roleManagement, rolePermissions, ROLES, UnauthorizedError, getLogsSchema, authMiddleware (+4 more)

### Community 23 - "users.routes.js"
Cohesion: 0.14
Nodes (13): followSchema, getUserByNickNameSchema, getUsersSchema, updateRoleSchema, authMiddleware, followController, getUserByNickNameController, {
    getUserByNickNameSchema,
    getUsersSchema,
    followSchema,
    updateRoleSchema
} (+5 more)

### Community 24 - "comments.routes.js"
Cohesion: 0.17
Nodes (11): deleteCommentSchema, editCommentSchema, likeCommentSchema, authMiddleware, deleteCommentController, {
    deleteCommentSchema,
    editCommentSchema,
    likeCommentSchema
}, editCommentController, likeCommentController (+3 more)

### Community 25 - "Scribo Backend — Blog API Server"
Cohesion: 0.18
Nodes (10): API Documentation, Clone the repository, Environment variables, Features, Install dependencies, Installation & Running, Related Links, Run the server (+2 more)

### Community 26 - "package.json"
Cohesion: 0.20
Nodes (9): author, description, license, main, name, repository, type, url (+1 more)

### Community 27 - "db/email.js"
Cohesion: 0.31
Nodes (8): deleteVerificationCode(), emailFilter(), EmailVerificationCode, getVerificationCode(), incrementVerificationAttempts(), schema, {Schema, model}, assertResetCode()

### Community 28 - "analytics.routes.js"
Cohesion: 0.20
Nodes (9): getDashboardSchema, trackVisitSchema, authMiddleware, getDashboardController, optionalAuthMiddleware, { Router }, trackVisitController, { trackVisitSchema, getDashboardSchema } (+1 more)

### Community 29 - "devDependencies"
Cohesion: 0.22
Nodes (9): eslint, @eslint/js, globals, nodemon, devDependencies, eslint, @eslint/js, globals (+1 more)

### Community 30 - "defaultRoute.controller.js"
Cohesion: 0.32
Nodes (5): { defaultRoute }, defaultRouteController(), defaultRouteController, { Router }, defaultRoute()

### Community 31 - "resetPassword"
Cohesion: 0.38
Nodes (6): { resetPassword }, resetPasswordController(), BadRequestError, fieldError(), invalidCodeError(), resetPassword()

### Community 32 - "validate.middleware.js"
Cohesion: 0.43
Nodes (6): BadRequestError, { decode }, mongoose, push_to_errors(), validate(), validateMiddleware()

### Community 33 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, dev, lint, predev, prestart, start

### Community 35 - "SupportRequest.js"
Cohesion: 0.33
Nodes (5): KINDS, LEGACY_STATUSES, schema, { Schema, model, Types }, STATUSES

### Community 36 - "getSessions.controller.js"
Cohesion: 0.50
Nodes (4): getSessionsController(), { listUserSessions }, getSessionsByUserId(), listUserSessions()

### Community 37 - "confirmEmailCode"
Cohesion: 0.67
Nodes (3): { confirmEmailCode }, verificationEmailConfirmController(), confirmEmailCode()

### Community 38 - "password.js"
Cohesion: 0.67
Nodes (3): bcrypt, passwordRounds(), setPasswordHash()

### Community 39 - "vercel.json"
Cohesion: 0.50
Nodes (3): builds, rewrites, version

## Knowledge Gaps
- **364 isolated node(s):** `globals`, `name`, `version`, `description`, `main` (+359 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 383 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getUserById()` connect `users.services.js` to `support.service.js`, `session.service.js`, `profile.services.js`, `posts.services.js`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `actorFromProfile()` connect `support.service.js` to `posts.services.js`, `comments.services.js`, `analytics.services.js`, `categories.services.js`, `logs.services.js`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `assertPermission()` connect `support.service.js` to `posts.services.js`, `comments.services.js`, `analytics.services.js`, `categories.services.js`, `logs.services.js`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `globals`, `name`, `version` to the rest of the system?**
  _364 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `support.service.js` be split into smaller, more focused modules?**
  _Cohesion score 0.057703081232493 - nodes in this community are weakly interconnected._
- **Should `posts.services.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05117117117117117 - nodes in this community are weakly interconnected._
- **Should `comments.services.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05547785547785548 - nodes in this community are weakly interconnected._