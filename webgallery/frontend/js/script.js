/*jshint esversion: 6 */

(function () {
  "use strict";

  window.onload = function () {
    document
      .querySelector("#users-container")
      .addEventListener("change", function (e) {
        const username = document.getElementById("users-container").value;
        api.getImages(username);
      });
    // signup form
    document
      .querySelector("#create_signup_form")
      .addEventListener("submit", function (e) {
        e.preventDefault();
        const username = document.querySelector("#signup-username").value;
        const password = document.querySelector("#signup-password").value;
        api.signup(username, password);
        document.querySelector("#create_signup_form").reset();
      });

    // signin form
    document
      .querySelector("#create_signin_form")
      .addEventListener("submit", function (e) {
        e.preventDefault();
        const username = document.querySelector("#signin-username").value;
        const password = document.querySelector("#signin-password").value;
        api.signin(username, password);
        document.querySelector("#create_signin_form").reset();
      });

    // signout button
    document.querySelector("#signout").addEventListener("click", function (e) {
      api.signout();
    });

    api.onUsernameUpdate(function (usernames) {
      const usersList = document.querySelector("#users-container");
      usersList.innerHTML = "<option>Select a User</option>";
      usernames.forEach(function (username) {
        const div = document.createElement("option");
        div.innerHTML = username._id;
        div.addEventListener("click", function () {
          api.getImages(username._id);
        });
        usersList.append(div);
      });
    });

    api.onUserUpdate(function () {
      document.querySelector("#error-container").innerHTML = "";
      const username = api.getCurrentUser();
      if (username) {
        api.getUsers();
        document.querySelector("#signout-btn").classList.remove("hidden");
        document.querySelector("#image-form").classList.remove("hidden");
        document.querySelector("#hide-btn").classList.remove("hidden");
        document.querySelector("#users-container").classList.remove("hidden");
        document.querySelector("#signup-form").classList.add("hidden");
        document.querySelector("#signin-form").classList.add("hidden");
        document.querySelector("#image-display").classList.remove("hidden");
        document.querySelector("#comment-form").classList.remove("hidden");
        document.querySelector("#comment-section").classList.remove("hidden");
      } else {
        document.querySelector("#signout-btn").classList.add("hidden");
        document.querySelector("#image-form").classList.add("hidden");
        document.querySelector("#hide-btn").classList.add("hidden");
        document.querySelector("#users-container").classList.add("hidden");
        document.querySelector("#signup-form").classList.remove("hidden");
        document.querySelector("#signin-form").classList.remove("hidden");
        document.querySelector("#image-display").classList.add("hidden");
        document.querySelector("#comment-form").classList.add("hidden");
        document.querySelector("#comment-section").classList.add("hidden");
      }
    });

    // toggle hide/show form button
    document.querySelector("#hide-btn").addEventListener("click", function () {
      if (document.querySelector("#image-form").style.display === "none") {
        document.querySelector("#image-form").style = "";
        document.getElementById("hide-btn").innerHTML = "Hide form";
      } else {
        document.querySelector("#image-form").style = "display: none;";
        document.getElementById("hide-btn").innerHTML = "Show form";
      }
    });

    let imageIndex = 0;
    let globalImages = [];
    let globalComments = [];
    let commentsToSkip = 0;
    let commentsSkipped = 0;
    let displayedCommentsCounter = 0;

    api.onError(function (err) {
      document.querySelector("#error-container").innerHTML = err;
    });

    // display comments
    api.onCommentUpdate(function (comments) {
      globalComments = comments;

      document.querySelector(".comment-container").innerHTML = "";
      displayedCommentsCounter = 0;
      const newGlobalComments = globalComments.slice().reverse();
      newGlobalComments.forEach(function (comment) {
        if (globalImages[imageIndex] !== undefined) {
          if (comment.imageId === globalImages[imageIndex]._id) {
            if (displayedCommentsCounter < 10) {
              displayedCommentsCounter++;
              const author = comment.author;
              const content = comment.content;
              let date = comment.date;
              let newDate = new Date(date);
              const element = document.createElement("div");
              element.className = "comment";
              element.innerHTML = `
              <div class="comment-top">
                <div class="comment-author">${author}</div>
                <i class="delete-btn far fa-trash-alt"></i>
              </div>
              <div class="comment-bubble">${content}</div>
              <div>${newDate.toLocaleString()}</div>
              `;
              element
                .querySelector(".delete-btn")
                .addEventListener("click", function (e) {
                  api.deleteComment(comment._id);
                  commentsToSkip = 0;
                });
              document.querySelector(".comment-container").append(element);
            }
          }
        }
      });
    });

    // assign title, author, url to add image
    document
      .querySelector("#create_image_form")
      .addEventListener("submit", function (e) {
        e.preventDefault();
        const title = document.querySelector("#image-form-title").value;

        if (globalImages.length === 0) {
          document.querySelector("#image-display").style = "display: flex";
          document.querySelector("#comment-form").style = "display: flex";
          document.querySelector("#comment-section").style = "display: flex";
        }

        api.addImage(
          title,
          document.querySelector('#create_image_form input[name="imageFile"]')
            .files[0]
        );

        document.querySelector("#create_image_form").reset();
      });
    // file upload
    document
      .getElementById("image-form-url")
      .addEventListener("change", function (e) {
        document.querySelector("#file-name").textContent =
          document.getElementById("image-form-url").files[0].name;
      });

    // displaying first image with title, author, url
    // listener of observer pattern
    api.onImageUpdate(function (images) {
      if (images.length > globalImages.length) {
        // update image index
        imageIndex = images.length - 1;
      }

      globalImages = images;

      if (globalImages.length === 0) {
        document.querySelector("#image-display").style = "display: none;";
        document.querySelector("#comment-form").style = "display: none;";
        document.querySelector("#comment-section").style = "display: none;";
      } else {
        document.querySelector("#image-display").style = "display: flex;";
        document.querySelector("#comment-form").style = "display: flex;";
        document.querySelector("#comment-section").style = "display: flex;";
        const firstImageTitle = globalImages[imageIndex].title;
        const firstImageAuthor = globalImages[imageIndex].author;
        document.getElementById("image-title").innerHTML = `${firstImageTitle}`;
        document.getElementById(
          "image-author"
        ).innerHTML = `${firstImageAuthor}`;
        document.querySelector(
          "#image"
        ).innerHTML = `<img src="/api/images/${globalImages[imageIndex]._id}/" alt="Image" />`;

        document.querySelector(".comment-container").innerHTML = "";

        api.getComments(globalImages[imageIndex]._id);
      }
    });

    // click left button
    document.querySelector("#left-btn").addEventListener("click", function () {
      imageIndex--;
      if (globalImages[imageIndex] !== undefined) {
        document.getElementById(
          "image-title"
        ).innerHTML = `${globalImages[imageIndex].title}`;
        document.getElementById(
          "image-author"
        ).innerHTML = `${globalImages[imageIndex].author}`;
        document.querySelector(
          "#image"
        ).innerHTML = `<img src="/api/images/${globalImages[imageIndex]._id}/" alt="Image" />`;
        api.getComments(globalImages[imageIndex]._id);

        document.querySelector(".comment-container").innerHTML = "";
        displayedCommentsCounter = 0;
        commentsToSkip = 0;
      } else {
        document.querySelector("#left-btn").style = "color: red;";
        imageIndex++;
      }
    });

    // click right button
    document.querySelector("#right-btn").addEventListener("click", function () {
      imageIndex++;
      if (globalImages[imageIndex] !== undefined) {
        document.getElementById(
          "image-title"
        ).innerHTML = `${globalImages[imageIndex].title}`;
        document.getElementById(
          "image-author"
        ).innerHTML = `${globalImages[imageIndex].author}`;
        document.querySelector(
          "#image"
        ).innerHTML = `<img src="/api/images/${globalImages[imageIndex]._id}/" alt="Image" />`;
        api.getComments(globalImages[imageIndex]._id);

        document.querySelector(".comment-container").innerHTML = "";
        displayedCommentsCounter = 0;
        commentsToSkip = 0;
      } else {
        document.querySelector("#right-btn").style = "color: red;";
        imageIndex--;
      }
    });

    // delete image
    document
      .querySelector("#image-delete-btn")
      .addEventListener("click", function () {
        if (globalImages[imageIndex + 1] === undefined) {
          if (globalImages[imageIndex - 1] === undefined) {
            api.deleteImage(globalImages[imageIndex]._id);
          } else {
            imageIndex--;
            api.deleteImage(globalImages[imageIndex + 1]._id);
          }
        } else {
          api.deleteImage(globalImages[imageIndex]._id);
        }
      });

    // add comment to comment form
    document
      .querySelector("#comment-form")
      .addEventListener("submit", function (e) {
        e.preventDefault();
        const imageId = globalImages[imageIndex]._id;
        const content = document.querySelector("#comment-form-content").value;
        document.querySelector("#create_comment_form").reset();
        api.addComment(imageId, content);
        commentsToSkip = 0;

        document.querySelector(".comment-container").innerHTML = "";
        displayedCommentsCounter = 0;
        const newGlobalComments = globalComments.slice().reverse();
        newGlobalComments.forEach(function (comment) {
          if (comment.imageId === globalImages[imageIndex]._id) {
            if (displayedCommentsCounter < 10) {
              displayedCommentsCounter++;
              const author = comment.author;
              const content = comment.content;
              let date = comment.date;
              let newDate = new Date(date);
              const element = document.createElement("div");
              element.className = "comment";
              element.innerHTML = `
              <div class="comment-top">
                <div class="comment-author">${author}</div>
                <i class="delete-btn far fa-trash-alt"></i>
              </div>
              <div class="comment-bubble">${content}</div>
              <div>${newDate.toLocaleString()}</div>
              `;
              element
                .querySelector(".delete-btn")
                .addEventListener("click", function (e) {
                  api.deleteComment(comment._id);
                  commentsToSkip = 0;
                });
              document.querySelector(".comment-container").append(element);
            }
          }
        });
      });

    // click up button
    document.querySelector("#up-btn").addEventListener("click", function () {
      if (commentsToSkip > 0) {
        document.querySelector(".comment-container").innerHTML = "";
        // if theres 10 comments displayed and theres comments next
        // show the next comments
        commentsToSkip = commentsToSkip - 10;

        document.querySelector(".comment-container").innerHTML = "";
        commentsSkipped = 0;
        displayedCommentsCounter = 0;
        const newGlobalComments = globalComments.slice().reverse();
        newGlobalComments.forEach(function (comment) {
          if (comment.imageId === globalImages[imageIndex]._id) {
            if (commentsSkipped >= commentsToSkip) {
              if (displayedCommentsCounter < 10) {
                displayedCommentsCounter++;
                const author = comment.author;
                const content = comment.content;
                let date = comment.date;
                let newDate = new Date(date);
                const element = document.createElement("div");
                element.className = "comment";
                element.innerHTML = `
              <div class="comment-top">
                <div class="comment-author">${author}</div>
                <i class="delete-btn far fa-trash-alt"></i>
              </div>
              <div class="comment-bubble">${content}</div>
              <div>${newDate.toLocaleString()}</div>
              `;
                element
                  .querySelector(".delete-btn")
                  .addEventListener("click", function (e) {
                    api.deleteComment(comment._id);
                    commentsToSkip = 0;
                  });
                document.querySelector(".comment-container").append(element);
              }
            } else {
              commentsSkipped++;
            }
          }
        });
      } else {
        commentsToSkip = 0;
        document.querySelector("#up-btn").style = "color: red;";
      }
    });

    // click down button
    document.querySelector("#down-btn").addEventListener("click", function () {
      let currentImageComments = 0;
      globalComments.forEach(function (comment) {
        if (comment.imageId === globalImages[imageIndex]._id) {
          currentImageComments++;
        }
      });
      if (currentImageComments > commentsToSkip + 10) {
        document.querySelector(".comment-container").innerHTML = "";
        // if theres 10 comments displayed and theres comments next
        // show the next comments
        commentsToSkip = commentsToSkip + 10;

        document.querySelector(".comment-container").innerHTML = "";
        commentsSkipped = 0;
        displayedCommentsCounter = 0;
        const newGlobalComments = globalComments.slice().reverse();
        newGlobalComments.forEach(function (comment) {
          if (comment.imageId === globalImages[imageIndex]._id) {
            if (commentsSkipped >= commentsToSkip) {
              if (displayedCommentsCounter < 10) {
                displayedCommentsCounter++;
                const author = comment.author;
                const content = comment.content;
                const date = comment.date;
                const newDate = new Date(date);
                const element = document.createElement("div");
                element.className = "comment";
                element.innerHTML = `
              <div class="comment-top">
                <div class="comment-author">${author}</div>
                <i class="delete-btn far fa-trash-alt"></i>
              </div>
              <div class="comment-bubble">${content}</div>
              <div>${newDate.toLocaleString()}</div>
              `;
                element
                  .querySelector(".delete-btn")
                  .addEventListener("click", function (e) {
                    api.deleteComment(comment._id);
                    commentsToSkip = 0;
                  });
                document.querySelector(".comment-container").append(element);
              }
            } else {
              commentsSkipped++;
            }
          }
        });
      } else {
        commentsSkipped = 0;
        displayedCommentsCounter = 0;
        document.querySelector("#down-btn").style = "color: red;";
      }
    });

    const username = api.getCurrentUser();
    if (username) {
      api.getUsers();
      document.querySelector("#signout-btn").classList.remove("hidden");
      document.querySelector("#image-form").classList.remove("hidden");
      document.querySelector("#hide-btn").classList.remove("hidden");
      document.querySelector("#users-container").classList.remove("hidden");
    } else {
      document.querySelector("#signup-form").classList.remove("hidden");
      document.querySelector("#signin-form").classList.remove("hidden");
    }
  };
})();
