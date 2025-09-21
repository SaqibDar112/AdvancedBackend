import mongoose,{Schema} from "mongoose"; 
import mongooseAggregatePaginate from "mongoose";"mongoose-aggregate-paginate-v2" //we can write some additional queries with aggregation in our mongodb

const videoSchema = new Schema({
    videoFile:{
        type:String, //video url aayegi cloud se or jahan bhi video save ho i.e type = string
        required:true,
    },
    thumbnail:{
        type:String,
        required:true,
    },
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    duration:{
        type: Number,
        required:true,
    },
    views:{
        type:Number,
        default:0,
    },
    isPublished:{
        type:Boolean,
        default:true,
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref:"User"
    },

},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)
export const video = mongoose.model("Video",videoSchema);