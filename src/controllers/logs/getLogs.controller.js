const { getLogs } = require('../../services/logs.services')


const getLogsController = async (req, res, next) => {
    try {
        const result = await getLogs()
        
        res.status(200).json({
            status: true,
            message: "Logs fetched successfully!",
            data: result
        })
    }
    catch(e) {
        next(e)
    }
}

module.exports = getLogsController