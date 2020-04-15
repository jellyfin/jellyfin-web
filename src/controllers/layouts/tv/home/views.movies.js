import globalize from "globalize";
import spotlight from "./spotlight";
import imageLoader from "imageLoader";
import imagehelper from "components/layouts/tv/imagehelper";
import focusManager from "focusManager";
import cardBuilder from "cardBuilder";
import appRouter from "appRouter";
import "emby-itemscontainer";

function loadResume(element, apiClient, parentId) {
    const options = {
        Limit: 6,
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: "Primary,Backdrop,Thumb"
    };
    return apiClient.getResumableItems(apiClient.getCurrentUserId(), options).then(result => {
        const section = element.querySelector(".resumeSection");
        if (!section) {
            return;
        }
        cardBuilder.buildCards(result.Items, {
            parentContainer: section,
            itemsContainer: section.querySelector(".itemsContainer"),
            shape: "backdrop",
            overlayText: true,
            rows: 2,
            scalable: false,
            coverImage: true,
            showTitle: true
        });
        return;
    });
}

function loadLatest(element, apiClient, parentId) {
    const options = {
        IncludeItemTypes: "Movie",
        Limit: 12,
        ParentId: parentId,
        EnableImageTypes: "Primary,Backdrop,Thumb"
    };
    return apiClient.getLatestItems(options).then(result => {
        const section = element.querySelector(".latestSection");
        if (!section) {
            return;
        }
        cardBuilder.buildCards(result, {
            parentContainer: section,
            itemsContainer: section.querySelector(".itemsContainer"),
            shape: "portrait",
            overlayText: true,
            rows: 2,
            scalable: false,
            coverImage: true,
            showTitle: true
        });
        return;
    });
}

function loadFavoriteMovie(element, apiClient, parentId) {
    const options = {
        SortBy: "Random",
        IncludeItemTypes: "Movie",
        Limit: 6,
        Recursive: true,
        Fields: "PrimaryImageAspectRatio",
        Filters: "IsFavorite",
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: "Primary,Backdrop,Thumb"
    };
    return apiClient.getItems(apiClient.getCurrentUserId(), options).then(result => {
        const section = element.querySelector(".favoriteMovieSection");
        if (!section) {
            return;
        }
        cardBuilder.buildCards(result.Items, {
            parentContainer: section,
            itemsContainer: section.querySelector(".itemsContainer"),
            shape: "portrait",
            showTitle: true,
            overlayText: true,
            rows: 2,
            scalable: false
        });
        return;
    });
}

function loadSpotlight(instance, element, apiClient, parentId) {
    const options = {
        SortBy: "Random",
        IncludeItemTypes: "Movie",
        Limit: 20,
        Recursive: true,
        ParentId: parentId,
        EnableImageTypes: "Backdrop",
        ImageTypes: "Backdrop",
        Fields: "Taglines"
    };
    return apiClient.getItems(apiClient.getCurrentUserId(), options).then(result => {
        const card = element.querySelector(".wideSpotlightCard");
        instance.spotlight = new spotlight(card, result.Items, 767);
        return;
    });
}

function loadRecommendations(element, apiClient) {
    return apiClient.getMovieRecommendations({
        UserId: apiClient.getCurrentUserId(),
        categoryLimit: 4,
        ItemLimit: 8,
        ImageTypeLimit: 1,
        Fields: "PrimaryImageAspectRatio"
    }).then(recommendations => {
        const values = recommendations.map(getRecommendationHtml);
        const recs = element.querySelector(".recommendations");
        if (recs) {
            recs.innerHTML = "<div class=\"horizontalSectionsContainer\">" + values.join("") + "</div>";
            imageLoader.lazyChildren(recs);
        }
        return;
    });
}

function getRecommendationHtml(recommendation) {
    const cardsHtml = cardBuilder.getCardsHtml(recommendation.Items, {
        shape: "portrait",
        showTitle: true,
        overlayText: true,
        rows: 2,
        scalable: false
    });
    let html = "";
    let title = "";
    switch (recommendation.RecommendationType) {
        case "SimilarToRecentlyPlayed":
            title = globalize.translate("RecommendationBecauseYouWatched", recommendation.BaselineItemName);
            break;
        case "SimilarToLikedItem":
            title = globalize.translate("RecommendationBecauseYouLike", recommendation.BaselineItemName);
            break;
        case "HasDirectorFromRecentlyPlayed":
        case "HasLikedDirector":
            title = globalize.translate("RecommendationDirectedBy", recommendation.BaselineItemName);
            break;
        case "HasActorFromRecentlyPlayed":
        case "HasLikedActor":
            title = globalize.translate("RecommendationStarring", recommendation.BaselineItemName);
            break;
    }
    html += "<div class=\"horizontalSection\">";
    html += `<div class="sectionTitle">${title}</div>`;
    html += "<div is=\"emby-itemscontainer\" class=\"itemsContainer\">";
    html += cardsHtml;
    html += "</div>";
    html += "</div>";
    return html;
}

function loadImages(element, apiClient, parentId) {
    return apiClient.getItems(apiClient.getCurrentUserId(), {
        SortBy: "IsFavoriteOrLiked,Random",
        IncludeItemTypes: "Movie",
        Limit: 2,
        Recursive: true,
        ParentId: parentId,
        EnableImageTypes: "Backdrop",
        ImageTypes: "Backdrop"
    }).then(result => {
        const items = result.Items;
        const imgOptions = {
            maxWidth: 600
        };
        if (items.length > 0) {
            element.querySelector(".movieTrailersCard .cardImage").style.backgroundImage = "url('" + imagehelper.getbackdropImageUrl(items[0], imgOptions) + "')";
        }
        if (items.length > 1) {
            element.querySelector(".allMoviesCard .cardImage").style.backgroundImage = "url('" + imagehelper.getbackdropImageUrl(items[1], imgOptions) + "')";
        }
        return;
    });
}

function gotoMoviesView(tab, parentId) {
    appRouter.show("/movies.html?tab=" + tab + "&parentid=" + parentId);
}

export class view {
    constructor(element, apiClient, parentId, autoFocus) {
        if (autoFocus) {
            focusManager.autoFocus(element);
        }
        this.loadData = isRefresh => {
            const promises = [
                loadResume(element, apiClient, parentId),
                loadLatest(element, apiClient, parentId),
                loadFavoriteMovie(element, apiClient, parentId)
            ];
            if (!isRefresh) {
                promises.push(
                    loadRecommendations(element, apiClient)
                );
            }
            return Promise.all(promises);
        };
        loadSpotlight(this, element, apiClient, parentId);
        loadImages(element, apiClient, parentId);
        element.querySelector(".allMoviesCard").addEventListener("click", () => {
            gotoMoviesView("0", parentId);
        });
        element.querySelector(".movieTrailersCard").addEventListener("click", () => {
            gotoMoviesView("2", parentId);
        });
        element.querySelector(".movieGenresCard").addEventListener("click", () => {
            gotoMoviesView("5", parentId);
        });
        this.destroy = function () {
            if (this.spotlight) {
                this.spotlight.destroy();
                this.spotlight = null;
            }
        };
    }
}

export default view;
