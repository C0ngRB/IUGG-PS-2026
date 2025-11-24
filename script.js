document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menuToggle");
    const navDrawer = document.getElementById("navDrawer");
    const header = document.querySelector(".site-header");
    const navLinks = document.querySelectorAll(".nav-desktop .nav-link, .nav-drawer .nav-link");

    // 计算带 header 偏移的滚动
    function scrollToHash(hash) {
        const target = document.querySelector(hash);
        if (!target) return;

        const headerHeight = header ? header.offsetHeight : 0;
        const rect = target.getBoundingClientRect();
        const offsetTop = rect.top + window.pageYOffset - headerHeight - 8;

        window.scrollTo({
            top: offsetTop,
            behavior: "smooth"
        });
    }

    // 设置当前激活的导航链接（顶部 + 抽屉）
    function setActive(hash) {
        navLinks.forEach(link => {
            if (link.getAttribute("href") === hash) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    }

    // 绑定所有导航链接点击事件
    navLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            const href = this.getAttribute("href");
            if (!href || !href.startsWith("#")) {
                return;
            }
            e.preventDefault();

            scrollToHash(href);
            setActive(href);

            // 关闭抽屉导航（如果打开）
            if (navDrawer && navDrawer.classList.contains("open")) {
                navDrawer.classList.remove("open");
                if (menuToggle) {
                    menuToggle.classList.remove("open");
                }
            }

            // 同步 URL hash（可选）
            history.replaceState(null, "", href);
        });
    });

    // 汉堡按钮控制抽屉导航和自身动画
    if (menuToggle && navDrawer) {
        menuToggle.addEventListener("click", function () {
            const willOpen = !navDrawer.classList.contains("open");
            navDrawer.classList.toggle("open", willOpen);
            menuToggle.classList.toggle("open", willOpen);
        });
    }

    // 根据初始 hash 设置高亮与滚动，默认 Home
    const initialHash = window.location.hash || "#home";
    setActive(initialHash);
    if (initialHash !== "#home") {
        scrollToHash(initialHash);
    }
});
