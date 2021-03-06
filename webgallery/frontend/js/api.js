/*jshint esversion: 6 */

const api = (function () {
  "use strict";

  function send(method, url, data, callback) {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      if (xhr.status !== 200)
        callback("[" + xhr.status + "]" + xhr.responseText, null);
      else callback(null, JSON.parse(xhr.responseText));
    };
    xhr.open(method, url, true);
    if (!data) xhr.send();
    else {
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(data));
    }
  }

  const module = {};

  module.getCurrentUser = function () {
    const username = document.cookie.split("username=")[1];
    if (username !== undefined && username.length == 0) return null;
    return username;
  };

  /*  ******* Data types *******
        image objects must have at least the following attributes:
            - (String) _id 
            - (String) title
            - (String) author
            - (Date) date
    
        comment objects must have the following attributes
            - (String) _id
            - (String) imageId
            - (String) author
            - (String) content
            - (Date) date
    
    ****************************** */

  const errorListeners = [];

  function notifyErrorListeners(err) {
    errorListeners.forEach(function (listener) {
      listener(err);
    });
  }

  module.onError = function (listener) {
    errorListeners.push(listener);
  };

  const getImages = function (username, callback) {
    send("GET", `/api/users/${username}/images/`, null, callback);
  };

  module.getImages = function (username) {
    notifyImageListeners(username);
  };

  const imageListeners = [];

  function notifyImageListeners(username) {
    getImages(username, function (err, res) {
      if (err) return notifyErrorListeners(err);
      imageListeners.forEach(function (listener) {
        listener(res);
      });
    });
  }

  // call handler when an image is added or deleted from the gallery
  module.onImageUpdate = function (handler) {
    imageListeners.push(handler);
  };

  const getComments = function (imageId, callback) {
    send("GET", `/api/${imageId}/comments/`, null, callback);
  };

  module.getComments = function (imageId) {
    notifyCommentListeners(imageId);
  };

  const commentListeners = [];

  function notifyCommentListeners(imageId) {
    getComments(imageId, function (err, comments) {
      if (err) return notifyErrorListeners(err);
      commentListeners.forEach(function (listener) {
        listener(comments);
      });
    });
  }

  // call handler when a comment is added or deleted to an image
  module.onCommentUpdate = function (handler) {
    commentListeners.push(handler);
  };

  const userListeners = [];

  function notifyUserListeners(username) {
    userListeners.forEach(function (listener) {
      listener(username);
    });
  }

  module.onUserUpdate = function (handler) {
    userListeners.push(handler);
  };

  const usernameListeners = [];

  function notifyUsernameListeners(usernames) {
    usernameListeners.forEach(function (listener) {
      listener(usernames);
    });
  }

  module.onUsernameUpdate = function (handler) {
    usernameListeners.push(handler);
  };

  module.getUsers = function () {
    send("GET", "/api/users/", null, function (err, res) {
      if (err) return notifyErrorListeners(err);
      notifyUsernameListeners(res);
    });
  };

  module.signup = function (username, password) {
    send("POST", "/signup/", { username, password }, function (err, res) {
      if (err) return notifyErrorListeners(err);
      notifyUserListeners(module.getCurrentUser());
    });
  };

  module.signin = function (username, password) {
    send("POST", "/signin/", { username, password }, function (err, res) {
      if (err) return notifyErrorListeners(err);
      notifyUserListeners(module.getCurrentUser());
    });
  };

  module.signout = function () {
    send("GET", "/signout/", null, function (err, res) {
      if (err) return notifyErrorListeners(err);
      notifyUserListeners(module.getCurrentUser());
    });
  };

  // add an image to the gallery
  module.addImage = function (title, file) {
    sendFiles(
      "POST",
      "/api/images/",
      { title: title, imageFile: file },
      function (err, res) {
        if (err) return notifyErrorListeners(err);
        notifyImageListeners(module.getCurrentUser());
      }
    );
  };

  function sendFiles(method, url, data, callback) {
    const formdata = new FormData();
    Object.keys(data).forEach(function (key) {
      const value = data[key];
      formdata.append(key, value);
    });
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      if (xhr.status !== 200)
        callback("[" + xhr.status + "]" + xhr.responseText, null);
      else callback(null, JSON.parse(xhr.responseText));
    };
    xhr.open(method, url, true);
    xhr.send(formdata);
  }

  // delete an image from the gallery given its imageId
  module.deleteImage = function (imageId) {
    send("DELETE", `/api/images/${imageId}`, null, function (err, res) {
      if (err) return notifyErrorListeners(err);
      notifyImageListeners(module.getCurrentUser());
    });
  };

  // add a comment to an image
  module.addComment = function (imageId, content) {
    send(
      "POST",
      "/api/comments/",
      { content: content, imageId: imageId },
      function (err, res) {
        if (err) return notifyErrorListeners(err);
        notifyCommentListeners(imageId);
      }
    );
  };

  // delete a comment to an image
  module.deleteComment = function (commentId) {
    send(
      "DELETE",
      "/api/comments/" + commentId + "/",
      null,
      function (err, res) {
        if (err) return notifyErrorListeners(err);
        notifyCommentListeners(res.imageId);
      }
    );
  };

  return module;
})();
