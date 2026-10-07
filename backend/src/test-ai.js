import { parseSplit } from "./ai.js";

const people = [
  { name: "Sanket", email: "a@test.com" },
  { name: "Rahul", email: "b@test.com" },
  { name: "Priya", email: "c@test.com" },
];

const result = await parseSplit(
  "Dinner was $120. Sanket paid. Sanket and Rahul had drinks so they owe more than Priya.",
  people,
);
console.log(JSON.stringify(result, null, 2));
