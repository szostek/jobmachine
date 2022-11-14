import Job from "../models/Job.js"
import { StatusCodes } from "http-status-codes"
import { BadRequestError, UnAuthenticatedError, NotFoundError } from '../errors/index.js'
import checkPermissions from "../utils/CheckPermissions.js"
import mongoose from "mongoose"
import moment from 'moment'

const createJob = async (req, res) => {
    const { position, company } = req.body
    if (!position || !company) {
        throw new BadRequestError('Please provide all values')
    }
    req.body.createdBy = req.user.userId
    const job = await Job.create(req.body)
    res.status(StatusCodes.CREATED).json({ job })
}

const getAllJobs = async (req, res) => {
    const jobs = await Job.find({ createdBy: req.user.userId })
    res.status(StatusCodes.OK).json({ jobs, totalJobs: jobs.length, numOfPages: 1 })
}

const updateJob = async (req, res) => {
    const { id: jobId } = req.params
    const { company, position } = req.body
    if (!company || !position) {
        throw new BadRequestError('Please provide all values')
    }
        
    const job = await Job.findOne({ _id: jobId })
    if (!job) {
        throw new NotFoundError(`No job with id: ${jobId}`)
    }
    // check for permission
    checkPermissions(req.user, job.createdBy)

    // runValidators only run on the info in req.body
    const updatedJob = await Job.findOneAndUpdate({ _id: jobId }, req.body, {
        new: true,
        runValidators: true,
    })
    res.status(StatusCodes.OK).json({ updatedJob })
}

const deleteJob = async (req, res) => {
    const { id: jobId } = req.params
        
    const job = await Job.findOne({ _id: jobId })
    if (!job) {
        throw new NotFoundError(`No job with id: ${jobId}`)
    }
    // check for permission
    checkPermissions(req.user, job.createdBy)

    // If job exists, and passes auth permission, then we can delete the job:
    await job.remove()

    res.status(StatusCodes.OK).json({ msg: 'Success! Job removed.' })
}

const showStats = async (req, res) => {
    // Matches all data belonging to the logged-in user:
    let stats = await Job.aggregate([
        { $match:{ createdBy: mongoose.Types.ObjectId(req.user.userId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ])
    stats = stats.reduce((acc, curItem) => {
        const { _id: title, count } = curItem
        acc[title] = count
        return acc
    }, {})
    const defaultStats = {
        pending: stats.pending || 0,
        interview: stats.interview || 0,
        declined: stats.declined || 0,
    }
    let monthlyApplications = await Job.aggregate([
        { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
        {
            $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 },
    ])
    monthlyApplications = monthlyApplications.map((item) => {
        const { _id: { year, month }, count } = item
        const date = moment().month(month - 1).year(year).format('MMM Y')
        return { date, count }
    }).reverse() // reverse gives us oldest to newest, for the chart from left to right

    res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications })
}
export { createJob, deleteJob, getAllJobs, updateJob, showStats }

