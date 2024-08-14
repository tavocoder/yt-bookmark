let youtubeLeftControls, youtubePlayer;
let currentVideo = "";
let currentVideoBookmarks = [];

const getTime = t => new Date(t * 1000).toISOString().slice(11, 19);

const createBookmarkButton = async () => {
  const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];

  if (!bookmarkBtnExists) {
    const bookmarkBtn = document.createElement("img");
    bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
    bookmarkBtn.className = "ytp-button " + "bookmark-btn";
    bookmarkBtn.title = "Click to bookmark current timestamp";
    return bookmarkBtn;
  }

  return bookmarkBtnExists;
}

const fetchBookmarks = () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get([currentVideo], (obj) => {
      resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
    });
  });
};

const addNewBookmarkEventHandler = async () => {
  const currentTime = youtubePlayer.currentTime;
  const newBookmark = {
    time: currentTime,
    desc: "Bookmark at " + getTime(currentTime),
  };

  currentVideoBookmarks = await fetchBookmarks();

  chrome.storage.sync.set({
    [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
  });
};

const youtubeLoaded = async () => {
  currentVideoBookmarks = await fetchBookmarks();

  const bookmarkBtn = await createBookmarkButton();

  youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
  youtubePlayer = document.getElementsByClassName('video-stream')[0];

  bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
  youtubeLeftControls.appendChild(bookmarkBtn);

};

chrome.runtime.onMessage.addListener((obj, sender, response) => {
  const { type, value, videoId } = obj;

  if (type === "LOAD") {
    currentVideo = videoId;
    youtubeLoaded();
  }
  if (type === "PLAY") {
    youtubePlayer.currentTime = value;
  }
  if (type === "DELETE") {
    currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
    chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });

    response(currentVideoBookmarks);
  }
});