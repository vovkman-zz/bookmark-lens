(function popup() {
  /**
   * Match tracking functions
   */
  let matches = [];
  let allMatches = [];

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

  const fuzzySearch = async input => {
    const searchTerm = input.target.value;
    if (searchTerm === '') {
      matches = [];
      removeOldMatchesFromDOM(allMatches);
    } else if (
      input.inputType === 'deleteContentBackward' ||
      input.inputType === 'insertFromPaste'
    ) {
      matches = matchAndTrack(allMatches, searchTerm);
      removeOldMatchesFromDOM(allMatches);
    } else if (matches.length > 0) {
      matches = matchAndTrack(matches, searchTerm);
      removeOldMatchesFromDOM(allMatches);
    }
    if (matches.length === 0 && searchTerm !== '') {
      const namesAndUrls = await getFlattenedBookmarks;
      matches = matchAndTrack(namesAndUrls, searchTerm);
      // We can do this because matches only holds variables (no functions)
      allMatches = JSON.parse(JSON.stringify(matches));
    }
    const rankedMatches = attachSearchMatchesToDOM(matches);
  };

  /**
   * HTML/DOM related functions
   */

  const removeOldMatchesFromDOM = matches =>
    Object.values(matches).map(({ id }) => {
      const elem = document.getElementById(id);
      if (elem) {
        elem.remove();
      }
    });

  const clickEnterOrScroll = keyup => {
    const { key } = keyup;
    const highlightedLink = document.getElementsByClassName(
      'highlighted_link',
    )[0];
    if (key === 'Enter' || key === 'ArrowUp' || key === 'ArrowDown') {
      keyup.preventDefault();
    }
    if (key === 'Enter') {
      highlightedLink.click();
    } else if (key === 'ArrowUp') {
      const previousSibling = highlightedLink.previousSibling;
      if (previousSibling) {
        highlightedLink.classList.toggle('highlighted_link');
        previousSibling.classList.toggle('highlighted_link');
      }
    } else if (key === 'ArrowDown') {
      const nextSibling = highlightedLink.nextSibling;
      if (nextSibling) {
        highlightedLink.classList.toggle('highlighted_link');
        nextSibling.classList.toggle('highlighted_link');
      }
    }
  };

  const attachSearchMatchesToDOM = matches => {
    const hasInputClass = 'bookmark_search_has_input';
    if (
      (matches.length > 0 &&
        !bookmarkSearch.className.match(new RegExp(hasInputClass, 'i'))) ||
      matches.length === 0
    ) {
      bookmarkSearch.classList.toggle('bookmark_search_has_input');
    }
    return matches.map((match, index) => {
      const bookmarkLink = document.createElement('option');
      bookmarkLink.className = 'bookmark_link';
      if (index === 0) {
        bookmarkLink.classList.toggle('highlighted_link');
      }
      bookmarkLink.id = match.id.toString();
      bookmarkLink.onclick = openInNewTab(match.url);
      bookmarkLink.innerText = match.name;
      bookmarkList.appendChild(bookmarkLink);
    });
  };

  const bookmarkSearch = document.getElementsByClassName('bookmark_search')[0];
  const bookmarkList = document.getElementsByClassName('bookmark_list')[0];
  bookmarkSearch.addEventListener('input', fuzzySearch);
  bookmarkSearch.addEventListener('keydown', clickEnterOrScroll);

  /**
   * Functions used to get and format all bookmarks
   */

  const getAllBookmarks = new Promise(resolve =>
    chrome.bookmarks.getTree(resolve),
  );

  const openInNewTab = url => () => {
    chrome.tabs.create({ url });
  };

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
          id: Math.floor(Math.random() * 1000000 + 1),
        },
      ];
    }
    return namesAndUrls;
  };
  const getFlattenedBookmarks = getAllBookmarks.then(getAllNamesAndUrls);
})();
