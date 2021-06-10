import mongoose from "mongoose";

const promoSchema = new mongoose.Schema({
  ycdealcount: {
    type: Number,
    default: 0,
  },
});

const Promo = mongoose.model("Promo", promoSchema);

export default Promo;
