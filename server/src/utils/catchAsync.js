const catchAsync = (requestHandler) => (req, res, next) =>{
    Promise.resolve(requestHandler(req, res, next)).catch((err)=>{
        console.error(err);
        next(err)
    })
}

export default catchAsync