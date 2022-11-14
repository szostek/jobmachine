import User from "../models/User.js"
import { StatusCodes } from "http-status-codes"
import { BadRequestError, UnAuthenticatedError } from '../errors/index.js'

const register = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        throw new BadRequestError('Please fill out all fields')
    }
    const userAlreadyExists = await User.findOne({email})
    if (userAlreadyExists) {
        throw new BadRequestError('Email already in use. Please choose another.')
    }
    //Create triggers mongoose middleware in User model:
    const user = await User.create({ name, email, password })
    //Calls createJWT method in the User schema to create the jwt token:
    const token = user.createJWT()
    // We override the response to NOT include the user's password:
    res.status(StatusCodes.CREATED).json({ user:{ email: user.email, lastName: user.lastName, location: user.location, name: user.name }, token })
}

const login = async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        throw new BadRequestError('Please provide all values')
    }
    const user = await User.findOne({ email }).select('+password') //Have to override password return here
        // This is because we set password select to false for incoming res
    //Validate passed-in email:
    if (!user) {
        throw new UnAuthenticatedError('Invalid credentials')
    }
    // Validate password:
    const isPasswordCorrect = await user.comparePassword(password)
    if (!isPasswordCorrect) {
        throw new UnAuthenticatedError('Invalid credentials')
    }
    // send back the token:
    const token = user.createJWT()
    //Set password back to undefined, so it doesn't appear in the res to client
    user.password = undefined

    res.status(StatusCodes.OK).json({ user, token, location: user.location })    
}

const updateUser = async (req, res) => {
    const { email, name, lastName, location } = req.body
    if (!email || !name || !lastName || !location) {
        throw new BadRequestError('Please provide all values')
    }
    const user = await User.findOne({ _id: req.user.userId })
    user.email = email
    user.name = name
    user.lastName = lastName
    user.location = location
    await user.save()

    const token = user.createJWT()
    res.status(StatusCodes.OK).json({ user, token, location: user.location })  
}

export { register, login, updateUser }