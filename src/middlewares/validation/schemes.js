class Schema {
    constructor() {
        this.fields = [];
    }

    required(type, options = {}) {
        return this.add(type, { ...options, optional: false });
    }

    optional(type, options = {}) {
        return this.add(type, { ...options, optional: true });
    }

    add(type, options = {}) {
        const {
            source = 'body',
            optional = false,
            ...rest
        } = options;

        this.fields.push({
            type,
            source,
            optional,
            ...rest
        });

        return this;
    }

    build() {
        return this.fields;
    }
}

const loginUsernameSchema = new Schema()
    .required('user_name')
    .required('password')
    .optional('city')
    .optional('region')
    .optional('country')
    .optional('ip')
    .build();

const loginGoogleSchema = new Schema()
    .required('google_token')
    .optional('city')
    .optional('region')
    .optional('country')
    .optional('ip')
    .build();

const registerEmailSchema = new Schema()
    .required('email')
    .required('password')
    .required('nick_name')
    .required('email_code')
    .optional('description')
    .build();

const registerGoogleSchema = new Schema()
    .required('google_token')
    .required('email')
    .required('password')
    .required('nick_name')
    .optional('description')
    .build();

const verificationGoogleSchema = new Schema()
    .required('google_token')
    .build();

const verificationEmailSchema = new Schema()
    .required('email')
    .build();

const verificationEmailConfirmSchema = new Schema()
    .required('email')
    .required('email_code')
    .build();

const forgotPasswordSchema = new Schema()
    .required('email')
    .build();

const confirmPasswordResetSchema = new Schema()
    .required('email')
    .required('email_code')
    .build();

const resetPasswordSchema = new Schema()
    .required('email')
    .required('email_code')
    .required('new_password')
    .required('new_password_confirm')
    .build();

const getPostsSchema = new Schema()
    .optional('author', { source: 'query' })
    .optional('category', { source: 'query' })
    .optional('expand', { source: 'query' })
    .optional('created_date', { source: 'query' })
    .optional('page', { source: 'query' })
    .optional('limit', { source: 'query' })
    .optional('ids', { source: 'query' })
    .optional('_id', { source: 'query' })
    .build();

const getPostByIdSchema = new Schema()
    .required('id', { source: 'params' })
    .optional('expand', { source: 'query' })
    .build();

const deleteCommentSchema = new Schema()
    .required('id', { source: 'params' })
    .build();

const likeCommentSchema = new Schema()
    .required('id', { source: 'params' })
    .build();

const editCommentSchema = new Schema()
    .required('id', { source: 'params' })
    .optional('comment_text', { source: 'body' })
    .build();

const createPostSchema = new Schema()
    .required('title')
    .required('content_text')
    .required('category')
    .optional('feature_image')
    .build();

const editPostSchema = new Schema()
    .required('id', { source: 'params' })
    .optional('title')
    .optional('content_text')
    .optional('category')
    .optional('feature_image')
    .build();

const deletePostSchema = new Schema()
    .required('id', { source: 'params' })
    .build();

const updateProfileSchema = new Schema()
    .optional('nick_name')
    .optional('description')
    .optional('avatar')
    .optional('is_email_public')
    .optional('is_saved_posts_public')
    .build();

const changePasswordSchema = new Schema()
    .required('current_password')
    .required('new_password')
    .required('new_password_confirm')
    .build();

const savePostSchema = new Schema()
    .required('id', { source: 'params' })
    .build();

const likePostSchema = new Schema()
    .required('id', { source: 'params' })
    .build();

const getUserByNickNameSchema = new Schema()
    .required('nick_name', { source: 'params' })
    .build();

const getUsersSchema = new Schema()
    .optional('nick_name', { source: 'query' })
    .optional('id', { source: 'query' })
    .optional('is_verified', { source: 'query' })
    .optional('is_admin', { source: 'query' })
    .build();

const followSchema = new Schema()
    .required('id', { source: 'params' })
    .build();

const commentsSchema = new Schema()
    .required('id', { source: 'params' })
    .optional('parent_comment_id')
    .required('comment_text')
    .build();

const editCategorySchema = new Schema()
    .required('id', { source: 'params' })
    .optional('name')
    .optional('icon')
    .optional('color')
    .build();
    
const createCategorySchema = new Schema()
    .required('name')
    .required('icon')
    .required('color')
    .build();

const deleteCategorySchema = new Schema()
    .required('id', { source: 'params' })
    .build();

const updateRoleSchema = new Schema()
    .required('id', { source: 'params' })
    .required('role')
    .build();

const getLogsSchema = new Schema()
    .optional('page', { source: 'query' })
    .optional('limit', { source: 'query' })
    .optional('user', { source: 'query' })
    .optional('post', { source: 'query' })
    .optional('category', { source: 'query' })
    .optional('support_request', { source: 'query' })
    .optional('type', { source: 'query' })
    .build();

const trackVisitSchema = new Schema()
    .required('path')
    .required('visitor_id')
    .optional('referrer')
    .optional('city')
    .optional('region')
    .optional('country')
    .optional('ip')
    .build();

const getDashboardSchema = new Schema()
    .optional('days', { source: 'query' })
    .build();

const createSupportRequestSchema = new Schema()
    .optional('email')
    .required('kind')
    .required('message')
    .build();

const getSupportRequestsSchema = new Schema()
    .optional('page', { source: 'query' })
    .optional('limit', { source: 'query' })
    .optional('status', { source: 'query' })
    .optional('kind', { source: 'query' })
    .optional('sort', { source: 'query' })
    .optional('order', { source: 'query' })
    .build();

const getSupportRequestSchema = new Schema()
    .required('id', { source: 'params' })
    .build();

const replySupportRequestSchema = new Schema()
    .required('id', { source: 'params' })
    .required('text')
    .build();

const getPublicSupportRequestSchema = new Schema()
    .required('key', { source: 'params' })
    .build();

const replyPublicSupportRequestSchema = new Schema()
    .required('key', { source: 'params' })
    .required('text')
    .build();

const updateSupportRequestStatusSchema = new Schema()
    .required('id', { source: 'params' })
    .required('status')
    .build();

module.exports = {
    loginUsernameSchema,
    loginGoogleSchema,
    registerEmailSchema,
    registerGoogleSchema,
    verificationGoogleSchema,
    verificationEmailSchema,
    verificationEmailConfirmSchema,
    forgotPasswordSchema,
    confirmPasswordResetSchema,
    resetPasswordSchema,
    getPostByIdSchema,
    createPostSchema,
    editPostSchema,
    deletePostSchema,
    updateProfileSchema,
    changePasswordSchema,
    savePostSchema,
    getUserByNickNameSchema,
    getUsersSchema,
    followSchema,
    getPostsSchema,
    commentsSchema,
    likePostSchema,
    editCategorySchema,
    createCategorySchema,
    deleteCategorySchema,
    deleteCommentSchema,
    editCommentSchema,
    likeCommentSchema,
    updateRoleSchema,
    getLogsSchema,
    trackVisitSchema,
    getDashboardSchema,
    createSupportRequestSchema,
    getSupportRequestsSchema,
    getSupportRequestSchema,
    replySupportRequestSchema,
    getPublicSupportRequestSchema,
    replyPublicSupportRequestSchema,
    updateSupportRequestStatusSchema
}