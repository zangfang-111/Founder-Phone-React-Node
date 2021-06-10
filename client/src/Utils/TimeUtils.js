import moment from "moment";

export function formatForDisplayDate(date) {
  return moment(date).format("MMM Do YYYY");
}

export function formatForDisplayDateTime(date) {
  return moment(date).format("hh:mm a MMM D YYYY");
}
