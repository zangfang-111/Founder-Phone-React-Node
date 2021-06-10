export const generateSlackChannelName = (text) => {
  return `fp_${
    process.env.NODE_ENV === "production"
      ? ""
      : `${process.env.NODE_ENV.toLowerCase()}_`
  }${text}`;
};
