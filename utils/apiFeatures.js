class APIFeatures
{
    constructor(query, queryString)
    {
        this.query = query
        this.queryString = queryString
    }

    filter()
    {
        // Query params will be complicated, so we need to see whats inside first and remove some keywords which will be handled in a different way
        const queryObj = {...this.queryString}
        const excludedFields = ['page', 'sort', 'limit', 'fields']
        excludedFields.forEach(el => delete queryObj[el])
        // console.log(queryObj)

        // Advanced filtering
        // {{localhost}}/api/v1/tours?duration[gte]=5&difficulty=easy
        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)  // eg. turns 'gte' to '$gte'
        // console.log(JSON.parse(queryStr))
        
        // const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy')
        
        // Build query
        this.query = this.query.find(JSON.parse(queryStr))

        return this
    }

    sort()
    {
        // Sorting
        // {{localhost}}/api/v1/tours?sort=price    (asc)
        // {{localhost}}/api/v1/tours?sort=-price   (desc)
        // {{localhost}}/api/v1/tours?sort=-price,duration  (multi sort)
        if (this.queryString.sort)
        {
            const sortBy = this.queryString.sort.split(',').join(' ')
            this.query = this.query.sort(sortBy)
        }
        else 
        {
            this.query = this.query.sort('-createdAt')
        }

        return this
    }

    limitFields()
    {
        // Limiting fields (negative sign in front of the field will remove it from the result, eg. -name)
        // {{localhost}}/api/v1/tours?fields=name,duration,difficulty,price
        if (this.queryString.fields)
        {
            const fields = this.queryString.fields.split(',').join(' ') 
            this.query = this.query.select(fields)
        }
        else 
        {
            this.query = this.query.select('-__v')
        }

        return this
    }

    paginate()
    {
        // Pagination
        // {{localhost}}/api/v1/tours?page=2&limit=3
        const page = +this.queryString.page || 1       // Also set default page
        const limit = +this.queryString.limit || 10     // Also set default limit
        const skip = (page - 1) * limit

        this.query = this.query.skip(skip).limit(limit)

        // If user tries to access a page greater than our results (not needed)
        // if (this.queryString.page)
        // {
        //     const numTours = await Tour.countDocuments()
        //     if (skip >= numTours) throw new Error('This page does not exist')
        // }

        return this
    }
}

module.exports = APIFeatures