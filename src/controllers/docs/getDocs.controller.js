const getDocsJson = require('../../services/docs.services')

const getDocs = async (req, res, next) => {
    try {
        const docs = getDocsJson(req, res, next);
        
        res.status(200).json({
            status: true,
            message: "Docs fetched successfully",
            data: docs
        })
    }
    catch(e) {
        next(e)
    }
}

module.exports = getDocs