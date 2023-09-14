import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    title:{
        type: String,
        required: [true,`Title is required`],
        trim: true,
        maxLength: [60,`max length of title is 60 characters only`]
    },
    description:{
        type: String,
        maxLength: [200,`max length of title is 200 characters only`],
        required: [true,`Description is required`]
    },
    category:{
        type: String,
        required: [true,`Category is required`]
    },
    thumbnail:{
        public_id: {
            type: String,
            required: true
        },
        secure_url: {
            type: String,
            required: true
        }
    },
    lectures:[
        {
            title: String,
            description: String,
            lecture: {
                public_id: {
                    type: String,
                    required: true
                },
                secure_url: {
                    type: String,
                    required: true
                }
            }
        }
    ],
    numberOfLectures:{
        type: Number,
        default: 0
    },
    createdBy:{
        type:String,
        required: [true,`This field is required`]
    }
},{
    timestamps:true
})

const Course = mongoose.model('Course',courseSchema)

export default Course