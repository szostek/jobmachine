// This custom error class extends from error class, is used as a base for all specific errors
class CustomAPIError extends Error{
    constructor(message) {
        super(message)        
    }
}

export default CustomAPIError