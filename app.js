const API_BASE = "https://jsonplaceholder.typicode.com";

const postsListEl = document.getElementById("postsList");
const detailsContainerEl = document.getElementById("detailsContainer");
const loadingIndicatorEl = document.getElementById("loadingIndicator");
const errorContainerEl = document.getElementById("errorContainer");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");
const statsContainer = document.getElementById("statsContainer");

async function fetchPosts(query = "") {
    showLoading(true);
    hideError();

    try {
        const url = query 
            ? `${API_BASE}/posts?title_like=${encodeURIComponent(query)}` 
            : `${API_BASE}/posts?_limit=15`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
        }

        const posts = await response.json();
        renderPosts(posts);

    } catch (error) {
        console.error("Ошибка при загрузке постов:", error);
        showError(`Не удалось загрузить данные: ${error.message}. Проверьте подключение к сети.`);
        postsListEl.innerHTML = "";
    } finally {
        showLoading(false);
    }
}

function renderPosts(posts) {
    postsListEl.innerHTML = "";

    if (posts.length === 0) {
        postsListEl.innerHTML = `<p class="placeholder-text">Ничего не найдено по вашему запросу.</p>`;
        return;
    }

    posts.forEach(post => {
        const div = document.createElement("div");
        div.className = "post-item";
        div.innerHTML = `
            <h4>${escapeHtml(post.title)}</h4>
            <p>${escapeHtml(post.body)}</p>
        `;
        div.addEventListener("click", () => fetchPostDetails(post.id));
        postsListEl.appendChild(div);
    });
}

async function fetchPostDetails(postId) {
    detailsContainerEl.innerHTML = `<div class="spinner"></div><p class="loading-text">Загрузка деталей...</p>`;

    try {
        const [postRes, commentsRes] = await Promise.all([
            fetch(`${API_BASE}/posts/${postId}`),
            fetch(`${API_BASE}/posts/${postId}/comments`)
        ]);

        if (!postRes.ok || !commentsRes.ok) {
            throw new Error("Не удалось получить детальную информацию.");
        }

        const post = await postRes.json();
        const comments = await commentsRes.json();

        renderDetails(post, comments);

    } catch (error) {
        detailsContainerEl.innerHTML = `<p class="error-msg">Ошибка загрузки деталей: ${error.message}</p>`;
    }
}

function renderDetails(post, comments) {
    detailsContainerEl.innerHTML = `
        <h3>${escapeHtml(post.title)}</h3>
        <p><strong>Содержание:</strong> ${escapeHtml(post.body)}</p>
        <div class="comments-section">
            <h4>Комментарии (${comments.length})</h4>
            ${comments.map(c => `
                <div class="comment-item">
                    <strong>${escapeHtml(c.name)} (${escapeHtml(c.email)}):</strong>
                    <p>${escapeHtml(c.body)}</p>
                </div>
            `).join("")}
        </div>
    `;
}

async function loadPlatformStats() {
    try {
        const [postsRes, usersRes, todosRes] = await Promise.all([
            fetch(`${API_BASE}/posts`),
            fetch(`${API_BASE}/users`),
            fetch(`${API_BASE}/todos`)
        ]);

        if (!postsRes.ok || !usersRes.ok || !todosRes.ok) {
            throw new Error("Ошибка загрузки статистики.");
        }

        const posts = await postsRes.json();
        const users = await usersRes.json();
        const todos = await todosRes.json();

        statsContainer.innerHTML = `
            <div class="stat-box">
                <h3>${posts.length}+</h3>
                <p>Всего постов</p>
            </div>
            <div class="stat-box">
                <h3>${users.length}</h3>
                <p>Активных авторов</p>
            </div>
            <div class="stat-box">
                <h3>${todos.length}+</h3>
                <p>Задач в системе</p>
            </div>
        `;
    } catch (error) {
        statsContainer.innerHTML = `<p class="error-msg">Не удалось загрузить статистику.</p>`;
    }
}

function showLoading(isLoading) {
    loadingIndicatorEl.style.display = isLoading ? "block" : "none";
}

function showError(message) {
    errorContainerEl.textContent = message;
    errorContainerEl.style.display = "block";
}

function hideError() {
    errorContainerEl.textContent = "";
    errorContainerEl.style.display = "none";
}

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, match => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[match]));
}

searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    fetchPosts(query);
});

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        fetchPosts(searchInput.value.trim());
    }
});

resetBtn.addEventListener("click", () => {
    searchInput.value = "";
    fetchPosts();
});

loadPlatformStats();
fetchPosts();
