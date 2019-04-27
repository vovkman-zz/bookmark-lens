const matchInput = (inputLetters, word) => {
  const inputRegex = new RegExp(inputLetters);
  const wordMatch = word.match(inputRegex);
  return wordMatch;
};

const getLastMatch = nameMatches => nameMatches[nameMatches.length - 1];

const buildInOrderRegex = (letters, word) =>
  letters.reduce((regex, letter) => `${regex}${letter}.*?`, '');

const isFuzzyMatch = (searchTerm, word) => {
  const searchLetters = searchTerm.split('');
  const searchTermRegexString = buildInOrderRegex(searchLetters, searchTerm);
  const searchTermRegex = new RegExp(searchTermRegexString, 'i');
  const wordMatches = word.match(searchTermRegex);
  if (wordMatches) {
    return true;
  } else {
    return false;
  }
};

const matchAndTrack = (matches, searchTerm) => {
  return matches.filter(bookmark => {
    const { name } = bookmark;
    const fuzzyMatch = isFuzzyMatch(searchTerm, name);
    return fuzzyMatch;
  });
};

// const matchAndTrack = (matches, currentLetter) => {
//   console.log(matches);
//   return matches.map(bookmark => {
//     const { name, nameMatches } = bookmark;
//     const lastMatch = getLastMatch(nameMatches);
//     const curLetterMatch = matchInput(currentLetter, name);
//     const curLetterIndex = name.indexOf(currentLetter);
//     const isContinuousMatch =
//       lastMatch && lastMatch.continuous && curLetterMatch;
//     const wasContinuousMatch =
//       lastMatch && lastMatch.continuous && !curLetterMatch;
//     if (isContinuousMatch) {
//       const newMatchString = lastMatch.matchString.concat(currentLetter);
//       const isStillContinuous = matchInput(newMatchString, name);
//       if (isStillContinuous) {
//         lastMatch.matchString = lastMatch.matchString.concat(currentLetter);
//         nameMatches.splice(-1, 1, lastMatch);
//       } else {
//         lastMatch.continuous = false;
//         nameMatches.splice(-1, 1, lastMatch);
//         const newMatch = {
//           matchString: currentLetter,
//           continuous: true,
//         };
//         nameMatches.push(newMatch);
//       }
//     } else if (wasContinuousMatch) {
//       lastMatch.continuous = false;
//       nameMatches.splice(-1, 1, lastMatch);
//     } else if (curLetterMatch) {
//       const newMatch = {
//         matchString: currentLetter,
//         continuous: true,
//       };
//       nameMatches.push(newMatch);
//     }
//     bookmark.nameMatches = nameMatches;
//     return bookmark;
//   });
// };

/**
 * Functions used to get and format all bookmarks
 */

const getAllBookmarks = new Promise((resolve, reject) =>
  chrome.bookmarks.getTree(resolve),
);
const getAllNamesAndUrls = (bookmarkTreeNodes, childIndex = 0) => {
  let namesAndUrls = [];
  const bookmark = bookmarkTreeNodes[childIndex];
  if (bookmark === undefined) {
    return;
  } else if (bookmark.children) {
    let numChildren = bookmark.children.length - 1;
    while (numChildren >= 0) {
      let namesAndUrlsSubset = getAllNamesAndUrls(
        bookmark.children,
        numChildren,
      );
      namesAndUrls = namesAndUrls.concat(namesAndUrlsSubset);
      numChildren -= 1;
    }
  } else {
    return [
      {
        name: bookmark.title,
        url: bookmark.url,
        nameMatches: [],
        urlMatches: [],
        id: Math.floor(Math.random() * 1000000 + 1),
      },
    ];
  }
  return namesAndUrls;
};

const getFlattenedBookmarks = getAllBookmarks.then(getAllNamesAndUrls);

/**
 * Functions to interface with chrome api
 */

const openInNewTab = url => () => {
  chrome.tabs.create({ url });
};
