// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

const BASE_API_URL = "https://rithm-jeopardy.herokuapp.com/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;

let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
  const response = await axios.get(`${BASE_API_URL}categories`, {
    params: { count: 100 },
  });
  return _.sampleSize(
    response.data.map((c) => c.id),
    NUM_CATEGORIES
  );
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
  const response = await axios.get(`${BASE_API_URL}category`, {
    params: { id: catId },
  });
  return {
    title: response.data.title,
    clues: _.sampleSize(response.data.clues, NUM_CLUES_PER_CAT).map((c) => ({
      question: c.question,
      answer: c.answer,
      showing: null,
    })),
  };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
  hideLoadingView();
  const $thead = $("#jeopardy thead").empty();
  const $tbody = $("#jeopardy tbody").empty();

  for (const category of categories) {
    $thead.append($("<th>").text(category.title));
  }

  for (let clueIdx = 0; clueIdx < NUM_CLUES_PER_CAT; clueIdx++) {
    const $tr = $("<tr>");
    for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
      $tr.append(
        $("<td>")
          .attr("id", `${catIdx}-${clueIdx}`)
          .append($("<i>").addClass("fas fa-question-circle fa-3x"))
      );
    }
    $tbody.append($tr);
  }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
  const $tgt = $(evt.target);
  const [catId, clueId] = $tgt.attr("id").split("-");
  const clue = categories[catId].clues[clueId];
  let msg;

  if (!clue.showing) {
    msg = clue.question;
    clue.showing = "question";
  } else if (clue.showing === "question") {
    msg = clue.answer;
    clue.showing = "answer";
    $tgt.addClass("disabled");
  } else {
    return;
  }

  $tgt.html(msg);
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
  $("#jeopardy thead").empty();
  $("#jeopardy tbody").empty();
  $("#spin-container").show();
  $("#start").addClass("disabled").text("Loading...");
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
  $("#start").removeClass("disabled").text("Restart!");
  $("#spin-container").hide();
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  if ($("#start").text() !== "Loading...") {
    showLoadingView();
    const catIds = await getCategoryIds();
    categories = await Promise.all(catIds.map((catId) => getCategory(catId)));
    fillTable();
  }
}

/** On click of start / restart button, set up game. */

$("#start").on("click", setupAndStart);

/** On page load, add event handler for clicking clues */

$(async function () {
  $("#jeopardy").on("click", "td", handleClick);
});
