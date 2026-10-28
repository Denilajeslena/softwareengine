import io
import base64
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import qrcode
from flask import current_app
from app.services.database import get_mongo_client

# In-memory storage fallback for offline / development environments
_in_memory_books: Dict[str, Dict[str, Any]] = {}
_seeded = False


def _generate_default_copies(book_id: str, total_copies: int, available_copies: int, shelf_location: str) -> List[Dict[str, Any]]:
    copies = []
    for i in range(1, total_copies + 1):
        copy_num = f"{i:02d}"
        copy_id = f"CPY-{book_id}-{copy_num}"
        # If index exceeds available copies, mark as borrowed
        status = "available" if i <= available_copies else "borrowed"
        copies.append({
            "copyId": copy_id,
            "bookId": book_id,
            "copyNumber": i,
            "status": status,
            "shelfLocation": shelf_location,
            "barcode": f"SCHOLARS-COPY-{book_id}-{copy_num}",
            "addedAt": "2026-01-10T10:00:00Z",
        })
    return copies


def _seed_initial_books():
    global _seeded
    if _seeded:
        return

    raw_seed = [
        {
            "id": "b-001",
            "isbn": "978-0131103627",
            "title": "The C Programming Language",
            "author": "Brian W. Kernighan & Dennis M. Ritchie",
            "publisher": "Prentice Hall",
            "year": 1988,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf B-12",
            "totalCopies": 8,
            "availableCopies": 3,
            "description": "The definitive guide to ANSI standard C language programming, written by the original creators Dennis Ritchie and Brian Kernighan.",
            "accentColor": "#183D32",
            "tags": ["C", "Systems Programming", "Classic"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-002",
            "isbn": "978-0262033848",
            "title": "Introduction to Algorithms (CLRS)",
            "author": "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
            "publisher": "MIT Press",
            "year": 2009,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf A-04",
            "totalCopies": 12,
            "availableCopies": 4,
            "description": "Comprehensive textbook offering an in-depth exploration of modern computer algorithms, data structures, and asymptotic complexity analysis.",
            "accentColor": "#102B24",
            "tags": ["Algorithms", "Data Structures", "Theory"],
            "rating": 4.8,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-003",
            "isbn": "978-0134610993",
            "title": "Artificial Intelligence: A Modern Approach",
            "author": "Stuart Russell & Peter Norvig",
            "publisher": "Pearson",
            "year": 2020,
            "category": "Artificial Intelligence",
            "shelfLocation": "Stack 4, Shelf C-01",
            "totalCopies": 10,
            "availableCopies": 2,
            "description": "The leading authoritative global introduction to the theory and practice of artificial intelligence, search algorithms, probability, and machine learning.",
            "accentColor": "#2D6554",
            "tags": ["AI", "Machine Learning", "Core Textbook"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-004",
            "isbn": "978-0262035613",
            "title": "Deep Learning",
            "author": "Ian Goodfellow, Yoshua Bengio & Aaron Courville",
            "publisher": "MIT Press",
            "year": 2016,
            "category": "Artificial Intelligence",
            "shelfLocation": "Stack 4, Shelf C-08",
            "totalCopies": 6,
            "availableCopies": 1,
            "description": "An essential textbook on neural networks, mathematical foundations of deep learning, convolutional networks, and deep generative models.",
            "accentColor": "#183D32",
            "tags": ["Deep Learning", "Neural Networks", "Math"],
            "rating": 4.7,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-005",
            "isbn": "978-0387953854",
            "title": "Linear Algebra Done Right",
            "author": "Sheldon Axler",
            "publisher": "Springer",
            "year": 2015,
            "category": "Mathematics",
            "shelfLocation": "Stack 2, Shelf D-03",
            "totalCopies": 7,
            "availableCopies": 5,
            "description": "A revolutionary approach to linear algebra focusing on vector spaces and linear operators, de-emphasizing determinants.",
            "accentColor": "#C3A66B",
            "tags": ["Linear Algebra", "Pure Mathematics", "Vector Spaces"],
            "rating": 4.8,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-006",
            "isbn": "978-0321751041",
            "title": "Calculus: Early Transcendentals",
            "author": "James Stewart",
            "publisher": "Cengage Learning",
            "year": 2015,
            "category": "Mathematics",
            "shelfLocation": "Stack 2, Shelf D-09",
            "totalCopies": 14,
            "availableCopies": 6,
            "description": "Acclaimed for mathematical precision, accuracy, and outstanding problem sets spanning differential and integral calculus.",
            "accentColor": "#3C4541",
            "tags": ["Calculus", "Analysis", "Foundations"],
            "rating": 4.6,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-007",
            "isbn": "978-0141439518",
            "title": "Pride and Prejudice",
            "author": "Jane Austen",
            "publisher": "Penguin Classics",
            "year": 1813,
            "category": "Literature",
            "shelfLocation": "Stack 6, Shelf L-11",
            "totalCopies": 9,
            "availableCopies": 7,
            "description": "Classic romantic novel following the turbulent relationship between Elizabeth Bennet, the daughter of a country gentleman, and Fitzwilliam Darcy.",
            "accentColor": "#A6884F",
            "tags": ["Classics", "19th Century", "British Literature"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-008",
            "isbn": "978-0451524935",
            "title": "1984",
            "author": "George Orwell",
            "publisher": "Signet Classic",
            "year": 1949,
            "category": "Literature",
            "shelfLocation": "Stack 6, Shelf L-18",
            "totalCopies": 11,
            "availableCopies": 0,
            "description": "Dystopian masterpiece chronicling the life of Winston Smith under the watchful, totalitarian surveillance of Big Brother and the Party.",
            "accentColor": "#102B24",
            "tags": ["Dystopia", "Political Fiction", "Modern Classic"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-009",
            "isbn": "978-0062316097",
            "title": "Sapiens: A Brief History of Humankind",
            "author": "Yuval Noah Harari",
            "publisher": "Harper",
            "year": 2014,
            "category": "History",
            "shelfLocation": "Stack 5, Shelf H-02",
            "totalCopies": 8,
            "availableCopies": 3,
            "description": "A groundbreaking exploration of human history, from early archaic human species walking the Earth through the cognitive, agricultural, and scientific revolutions.",
            "accentColor": "#235345",
            "tags": ["Anthropology", "World History", "Evolution"],
            "rating": 4.7,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-010",
            "isbn": "978-0199297788",
            "title": "The Oxford Illustrated History of the World",
            "author": "Felipe Fernández-Armesto",
            "publisher": "Oxford University Press",
            "year": 2019,
            "category": "History",
            "shelfLocation": "Stack 5, Shelf H-07",
            "totalCopies": 5,
            "availableCopies": 5,
            "description": "Authoritative illustrated history covering civilizations, global transformations, environmental impacts, and geopolitical eras.",
            "accentColor": "#183D32",
            "tags": ["World History", "Illustrated", "Reference"],
            "rating": 4.6,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-011",
            "isbn": "978-0465026562",
            "title": "The Feynman Lectures on Physics",
            "author": "Richard P. Feynman, Robert B. Leighton & Matthew Sands",
            "publisher": "Basic Books",
            "year": 2011,
            "category": "Science",
            "shelfLocation": "Stack 1, Shelf S-05",
            "totalCopies": 6,
            "availableCopies": 2,
            "description": "Timeless lectures spanning classical mechanics, electromagnetism, quantum mechanics, and thermodynamics by Nobel Laureate Richard Feynman.",
            "accentColor": "#102B24",
            "tags": ["Physics", "Quantum Mechanics", "Classic"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-012",
            "isbn": "978-0393609394",
            "title": "Astrophysics for People in a Hurry",
            "author": "Neil deGrasse Tyson",
            "publisher": "W. W. Norton & Company",
            "year": 2017,
            "category": "Science",
            "shelfLocation": "Stack 1, Shelf S-12",
            "totalCopies": 8,
            "availableCopies": 4,
            "description": "A crisp, insightful guide to the cosmos covering black holes, quantum mechanics, the Big Bang, and the search for extraterrestrial life.",
            "accentColor": "#2D6554",
            "tags": ["Astrophysics", "Cosmology", "Space"],
            "rating": 4.7,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-013",
            "isbn": "978-1491950296",
            "title": "Full Stack Web Development with React and Node.js",
            "author": "Robin Wieruch & David Flanagan",
            "publisher": "O'Reilly Media",
            "year": 2023,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf B-08",
            "totalCopies": 10,
            "availableCopies": 6,
            "description": "A comprehensive practical guide to building modern full stack web applications using React, Node.js, Express, TypeScript, and REST/GraphQL APIs.",
            "accentColor": "#183D32",
            "tags": ["Full Stack", "React", "Node.js", "Web Development", "TypeScript"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-014",
            "isbn": "978-1449373320",
            "title": "Designing Data-Intensive Applications",
            "author": "Martin Kleppmann",
            "publisher": "O'Reilly Media",
            "year": 2017,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf C-02",
            "totalCopies": 12,
            "availableCopies": 5,
            "description": "The definitive architectural bible for understanding distributed storage, stream processing, replication, transactions, and consensus protocols.",
            "accentColor": "#102B24",
            "tags": ["Distributed Systems", "Databases", "System Design", "Architecture"],
            "rating": 5.0,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-015",
            "isbn": "978-0132350884",
            "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
            "author": "Robert C. Martin",
            "publisher": "Prentice Hall",
            "year": 2008,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf B-10",
            "totalCopies": 8,
            "availableCopies": 3,
            "description": "Essential principles, patterns, and practices for writing readable, maintainable, modular software with rigorous automated test suites.",
            "accentColor": "#1B4332",
            "tags": ["Clean Code", "Software Engineering", "Refactoring", "Agile"],
            "rating": 4.8,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-016",
            "isbn": "978-0201633610",
            "title": "Design Patterns: Elements of Reusable Object-Oriented Software",
            "author": "Erich Gamma, Richard Helm, Ralph Johnson & John Vlissides",
            "publisher": "Addison-Wesley",
            "year": 1994,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf B-15",
            "totalCopies": 7,
            "availableCopies": 4,
            "description": "The landmark Gang of Four catalog of 23 classic software design patterns across creational, structural, and behavioral paradigms.",
            "accentColor": "#2D6554",
            "tags": ["Design Patterns", "OOP", "Architecture", "Classic"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-017",
            "isbn": "979-8664653403",
            "title": "System Design Interview: An Insider's Guide",
            "author": "Alex Xu",
            "publisher": "Independently Published",
            "year": 2020,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf C-06",
            "totalCopies": 10,
            "availableCopies": 5,
            "description": "Step-by-step visual blueprints for designing scalable real-world architectures: rate limiters, distributed caches, messaging queues, and video streaming.",
            "accentColor": "#183D32",
            "tags": ["System Design", "Scalability", "Cloud Architecture", "Full Stack"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-018",
            "isbn": "978-1484258682",
            "title": "Modern Full-Stack Development",
            "author": "Frank Zammetti",
            "publisher": "Apress",
            "year": 2022,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf B-05",
            "totalCopies": 6,
            "availableCopies": 4,
            "description": "Hands-on projects covering full stack web development with TypeScript, React, Node.js, Express, MongoDB, and WebSockets.",
            "accentColor": "#1B4332",
            "tags": ["Full Stack", "TypeScript", "React", "MongoDB", "Web Development"],
            "rating": 4.7,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-019",
            "isbn": "978-1492056355",
            "title": "Fluent Python: Clear, Concise, and Effective Programming",
            "author": "Luciano Ramalho",
            "publisher": "O'Reilly Media",
            "year": 2022,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf A-11",
            "totalCopies": 9,
            "availableCopies": 5,
            "description": "An advanced masterclass in idiomatic Python: descriptors, metaclasses, decorators, generators, asynchronous programming, and typing.",
            "accentColor": "#102B24",
            "tags": ["Python", "Advanced Programming", "Backend", "Best Practices"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-020",
            "isbn": "978-1593279509",
            "title": "Eloquent JavaScript: A Modern Introduction to Programming",
            "author": "Marijn Haverbeke",
            "publisher": "No Starch Press",
            "year": 2018,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf B-02",
            "totalCopies": 8,
            "availableCopies": 4,
            "description": "An engaging, deep dive into the JavaScript language, functional programming, DOM manipulation, asynchronous programming, and Node.js.",
            "accentColor": "#2D6554",
            "tags": ["JavaScript", "Frontend", "Web Development", "Algorithms"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-021",
            "isbn": "978-1119800361",
            "title": "Operating System Concepts",
            "author": "Abraham Silberschatz, Peter B. Galvin & Greg Gagne",
            "publisher": "Wiley",
            "year": 2021,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf A-01",
            "totalCopies": 10,
            "availableCopies": 3,
            "description": "The classic 'Dinosaur Book' covering fundamental OS principles: kernel architecture, CPU scheduling, virtual memory, concurrency, and file systems.",
            "accentColor": "#183D32",
            "tags": ["Operating Systems", "Concurrency", "Virtual Memory", "Kernel"],
            "rating": 4.7,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-022",
            "isbn": "978-0136681557",
            "title": "Computer Networking: A Top-Down Approach",
            "author": "James F. Kurose & Keith W. Ross",
            "publisher": "Pearson",
            "year": 2021,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf A-08",
            "totalCopies": 8,
            "availableCopies": 4,
            "description": "Comprehensive exploration of computer networks from the application layer down to the physical layer, including HTTP/3, DNS, TCP/IP, and wireless protocols.",
            "accentColor": "#102B24",
            "tags": ["Networking", "Protocols", "TCP/IP", "Internet", "Security"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-023",
            "isbn": "978-0078022159",
            "title": "Database System Concepts",
            "author": "Abraham Silberschatz, Henry F. Korth & S. Sudarshan",
            "publisher": "McGraw-Hill",
            "year": 2020,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf C-01",
            "totalCopies": 9,
            "availableCopies": 5,
            "description": "Core textbook covering relational algebra, SQL optimization, ACID transactions, B-tree indexing, query processing, and modern NoSQL systems.",
            "accentColor": "#1B4332",
            "tags": ["Databases", "SQL", "NoSQL", "Transactions", "Data Storage"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-024",
            "isbn": "978-0135957059",
            "title": "The Pragmatic Programmer: Your Journey to Mastery",
            "author": "David Thomas & Andrew Hunt",
            "publisher": "Addison-Wesley",
            "year": 2019,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf B-11",
            "totalCopies": 10,
            "availableCopies": 6,
            "description": "20th Anniversary Edition packed with career-long wisdom on software craft, debugging, automation, communication, and pragmatic architectural thinking.",
            "accentColor": "#2D6554",
            "tags": ["Software Craftsmanship", "Career", "Pragmatic", "Best Practices"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-025",
            "isbn": "978-0984782857",
            "title": "Cracking the Coding Interview",
            "author": "Gayle Laakmann McDowell",
            "publisher": "CareerCup",
            "year": 2015,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf A-05",
            "totalCopies": 15,
            "availableCopies": 4,
            "description": "189 programming questions and solutions covering algorithmic problem solving, big-O notation, linked lists, binary trees, dynamic programming, and system design.",
            "accentColor": "#183D32",
            "tags": ["Interview Prep", "Algorithms", "Data Structures", "Coding"],
            "rating": 4.8,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-026",
            "isbn": "978-1098104030",
            "title": "Python for Data Analysis",
            "author": "Wes McKinney",
            "publisher": "O'Reilly Media",
            "year": 2022,
            "category": "Artificial Intelligence",
            "shelfLocation": "Stack 4, Shelf C-04",
            "totalCopies": 10,
            "availableCopies": 5,
            "description": "Written by the creator of pandas, this hands-on guide covers data wrangling, cleaning, transformation, and statistical computing with pandas and NumPy.",
            "accentColor": "#102B24",
            "tags": ["Data Science", "Python", "Pandas", "NumPy", "Analytics"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-027",
            "isbn": "978-1098125974",
            "title": "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow",
            "author": "Aurélien Géron",
            "publisher": "O'Reilly Media",
            "year": 2022,
            "category": "Artificial Intelligence",
            "shelfLocation": "Stack 4, Shelf C-07",
            "totalCopies": 11,
            "availableCopies": 6,
            "description": "The definitive concrete guide to machine learning and deep learning using Python, Scikit-Learn, and TensorFlow, from regression to transformers.",
            "accentColor": "#1B4332",
            "tags": ["Machine Learning", "Scikit-Learn", "TensorFlow", "Deep Learning", "AI"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-028",
            "isbn": "978-0387310732",
            "title": "Pattern Recognition and Machine Learning",
            "author": "Christopher M. Bishop",
            "publisher": "Springer",
            "year": 2006,
            "category": "Artificial Intelligence",
            "shelfLocation": "Stack 4, Shelf C-10",
            "totalCopies": 7,
            "availableCopies": 3,
            "description": "A rigorous mathematical treatment of Bayesian probability, graphical models, kernel methods, variational inference, and pattern classification.",
            "accentColor": "#2D6554",
            "tags": ["Machine Learning", "Bayesian", "Statistics", "Theory"],
            "rating": 4.9,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-029",
            "isbn": "978-0321486813",
            "title": "Compilers: Principles, Techniques, and Tools",
            "author": "Alfred V. Aho, Monica S. Lam, Ravi Sethi & Jeffrey D. Ullman",
            "publisher": "Pearson",
            "year": 2006,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf A-09",
            "totalCopies": 6,
            "availableCopies": 2,
            "description": "The world-famous 'Dragon Book' on compiler design: lexical analysis, parsing, syntax-directed translation, code generation, and instruction-level optimization.",
            "accentColor": "#183D32",
            "tags": ["Compilers", "Parsing", "Language Design", "Dragon Book"],
            "rating": 4.7,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-030",
            "isbn": "978-1118026472",
            "title": "The Web Application Hacker's Handbook",
            "author": "Dafydd Stuttard & Marcus Pinto",
            "publisher": "Wiley",
            "year": 2011,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf C-12",
            "totalCopies": 8,
            "availableCopies": 4,
            "description": "The essential handbook for discovering and exploiting security flaws in web applications: injection attacks, broken access controls, and authentication bypasses.",
            "accentColor": "#102B24",
            "tags": ["Cybersecurity", "Web Security", "Penetration Testing", "Hacking"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-031",
            "isbn": "978-1492043799",
            "title": "Kubernetes: Up and Running",
            "author": "Kelsey Hightower, Brendan Burns & Joe Beda",
            "publisher": "O'Reilly Media",
            "year": 2022,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf C-09",
            "totalCopies": 8,
            "availableCopies": 5,
            "description": "Dive into container orchestration with Kubernetes: building, deploying, scaling, and managing microservices in production cloud environments.",
            "accentColor": "#1B4332",
            "tags": ["Kubernetes", "DevOps", "Cloud", "Containers", "Microservices"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-032",
            "isbn": "978-1916585256",
            "title": "Docker Deep Dive",
            "author": "Nigel Poulton",
            "publisher": "Independently Published",
            "year": 2023,
            "category": "Computer Science",
            "shelfLocation": "Stack 3, Shelf C-08",
            "totalCopies": 9,
            "availableCopies": 6,
            "description": "Master containerization from the ground up: Docker engine, image layers, Dockerfiles, multi-stage builds, networking, and security best practices.",
            "accentColor": "#2D6554",
            "tags": ["Docker", "DevOps", "Containers", "Full Stack", "Cloud"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-033",
            "isbn": "978-0060935467",
            "title": "To Kill a Mockingbird",
            "author": "Harper Lee",
            "publisher": "Harper Perennial",
            "year": 1960,
            "category": "Literature",
            "shelfLocation": "Stack 5, Shelf L-02",
            "totalCopies": 10,
            "availableCopies": 7,
            "description": "A timeless Pulitzer Prize-winning classic exploring racial injustice, compassion, courage, and moral growth in the American South through young Scout Finch.",
            "accentColor": "#183D32",
            "tags": ["Classic Literature", "Pulitzer Prize", "American Fiction"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-034",
            "isbn": "978-0451524935",
            "title": "1984",
            "author": "George Orwell",
            "publisher": "Signet Classic",
            "year": 1949,
            "category": "Literature",
            "shelfLocation": "Stack 5, Shelf L-05",
            "totalCopies": 12,
            "availableCopies": 8,
            "description": "The quintessential dystopian masterpiece examining totalitarianism, surveillance states, thought control, doublethink, and the erasure of historical truth.",
            "accentColor": "#102B24",
            "tags": ["Dystopian", "Classic", "Political Fiction", "Literature"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-035",
            "isbn": "978-0743273565",
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "publisher": "Scribner",
            "year": 1925,
            "category": "Literature",
            "shelfLocation": "Stack 5, Shelf L-08",
            "totalCopies": 8,
            "availableCopies": 5,
            "description": "The poignant portrait of the Jazz Age, romantic disillusionment, unbridled ambition, and the elusive American Dream in 1920s Long Island.",
            "accentColor": "#1B4332",
            "tags": ["American Literature", "Jazz Age", "Classic"],
            "rating": 4.7,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-036",
            "isbn": "978-0062316097",
            "title": "Sapiens: A Brief History of Humankind",
            "author": "Yuval Noah Harari",
            "publisher": "Harper",
            "year": 2014,
            "category": "History",
            "shelfLocation": "Stack 5, Shelf H-01",
            "totalCopies": 14,
            "availableCopies": 6,
            "description": "A sweeping historical and biological account of how an insignificant ape became the ruler of planet Earth through cognitive, agricultural, and scientific revolutions.",
            "accentColor": "#2D6554",
            "tags": ["Human History", "Anthropology", "Civilization", "Bestseller"],
            "rating": 4.8,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-037",
            "isbn": "978-0393354324",
            "title": "Guns, Germs, and Steel: The Fates of Human Societies",
            "author": "Jared Diamond",
            "publisher": "W. W. Norton & Company",
            "year": 1997,
            "category": "History",
            "shelfLocation": "Stack 5, Shelf H-04",
            "totalCopies": 7,
            "availableCopies": 4,
            "description": "Pulitzer Prize-winning analysis demonstrating how geographic and environmental advantages shaped the unequal development of human societies over 13,000 years.",
            "accentColor": "#183D32",
            "tags": ["World History", "Geography", "Pulitzer Prize", "Society"],
            "rating": 4.7,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-038",
            "isbn": "978-0345539434",
            "title": "Cosmos",
            "author": "Carl Sagan",
            "publisher": "Ballantine Books",
            "year": 1980,
            "category": "Science",
            "shelfLocation": "Stack 1, Shelf S-01",
            "totalCopies": 9,
            "availableCopies": 5,
            "description": "Carl Sagan's celebrated poetic exploration of 15 billion years of cosmic evolution, the origin of life, planetary exploration, and the future of humanity.",
            "accentColor": "#102B24",
            "tags": ["Astronomy", "Cosmology", "Science", "Classic"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-039",
            "isbn": "978-0553380163",
            "title": "A Brief History of Time",
            "author": "Stephen Hawking",
            "publisher": "Bantam Books",
            "year": 1988,
            "category": "Science",
            "shelfLocation": "Stack 1, Shelf S-04",
            "totalCopies": 10,
            "availableCopies": 6,
            "description": "Stephen Hawking's landmark work introducing non-specialists to black holes, the Big Bang, general relativity, quantum mechanics, and the unified theory of physics.",
            "accentColor": "#1B4332",
            "tags": ["Theoretical Physics", "Cosmology", "Black Holes", "Classic"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-040",
            "isbn": "978-1285741550",
            "title": "Calculus: Early Transcendentals",
            "author": "James Stewart",
            "publisher": "Cengage Learning",
            "year": 2015,
            "category": "Mathematics",
            "shelfLocation": "Stack 2, Shelf D-01",
            "totalCopies": 12,
            "availableCopies": 7,
            "description": "The gold-standard university calculus textbook covering differential calculus, integral calculus, multivariable analysis, sequences, and vector calculus.",
            "accentColor": "#2D6554",
            "tags": ["Calculus", "Mathematics", "Analysis", "Engineering"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        # --- PHILOSOPHY & ETHICS ---
        {
            "id": "b-041",
            "isbn": "978-0140449334",
            "title": "Meditations",
            "author": "Marcus Aurelius (Translated by Martin Hammond)",
            "publisher": "Penguin Classics",
            "year": 2006,
            "category": "Philosophy",
            "shelfLocation": "Stack 6, Shelf P-01",
            "totalCopies": 10,
            "availableCopies": 6,
            "description": "The private spiritual reflections of the Roman Emperor Marcus Aurelius on Stoic duty, resilience, emotional mastery, and virtue in an unpredictable cosmos.",
            "accentColor": "#183D32",
            "tags": ["Stoicism", "Philosophy", "Ancient Rome", "Ethics", "Classic"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-042",
            "isbn": "978-0872201361",
            "title": "The Republic",
            "author": "Plato (Translated by G.M.A. Grube & C.D.C. Reeve)",
            "publisher": "Hackett Publishing",
            "year": 1992,
            "category": "Philosophy",
            "shelfLocation": "Stack 6, Shelf P-03",
            "totalCopies": 8,
            "availableCopies": 5,
            "description": "The foundational Western text exploring justice, the ideal city-state, the philosopher-king, the Allegory of the Cave, and the immortality of the soul.",
            "accentColor": "#102B24",
            "tags": ["Political Philosophy", "Plato", "Justice", "Classical Greece"],
            "rating": 4.8,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-043",
            "isbn": "978-0199213610",
            "title": "Nicomachean Ethics",
            "author": "Aristotle",
            "publisher": "Oxford World's Classics",
            "year": 2009,
            "category": "Philosophy",
            "shelfLocation": "Stack 6, Shelf P-05",
            "totalCopies": 7,
            "availableCopies": 4,
            "description": "Aristotle's masterwork on virtue ethics, eudaimonia (human flourishing), the doctrine of the mean, friendship, and practical moral wisdom.",
            "accentColor": "#1B4332",
            "tags": ["Virtue Ethics", "Aristotle", "Eudaimonia", "Philosophy"],
            "rating": 4.7,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-044",
            "isbn": "978-0140449235",
            "title": "Beyond Good and Evil",
            "author": "Friedrich Nietzsche",
            "publisher": "Penguin Classics",
            "year": 2003,
            "category": "Philosophy",
            "shelfLocation": "Stack 6, Shelf P-08",
            "totalCopies": 9,
            "availableCopies": 5,
            "description": "A devastating philosophical critique of traditional European morality, dogmatism, and the will to power in modern philosophical thought.",
            "accentColor": "#2D6554",
            "tags": ["Existentialism", "Nietzsche", "Morality", "Modern Philosophy"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-045",
            "isbn": "978-0521657297",
            "title": "Critique of Pure Reason",
            "author": "Immanuel Kant",
            "publisher": "Cambridge University Press",
            "year": 1999,
            "category": "Philosophy",
            "shelfLocation": "Stack 6, Shelf P-11",
            "totalCopies": 6,
            "availableCopies": 3,
            "description": "Kant's monumental Copernican revolution in philosophy investigating the limits of human reason, synthetic a priori judgments, and space and time.",
            "accentColor": "#183D32",
            "tags": ["Epistemology", "Kant", "Metaphysics", "German Idealism"],
            "rating": 4.7,
            "isFeatured": False,
            "status": "active",
        },

        # --- PSYCHOLOGY & COGNITIVE SCIENCE ---
        {
            "id": "b-046",
            "isbn": "978-0374533557",
            "title": "Thinking, Fast and Slow",
            "author": "Daniel Kahneman",
            "publisher": "Farrar, Straus and Giroux",
            "year": 2011,
            "category": "Psychology",
            "shelfLocation": "Stack 4, Shelf Y-01",
            "totalCopies": 14,
            "availableCopies": 6,
            "description": "Nobel Laureate Daniel Kahneman's definitive tour of the mind, contrasting fast intuitive System 1 with deliberate logical System 2 and cognitive biases.",
            "accentColor": "#102B24",
            "tags": ["Behavioral Economics", "Cognitive Biases", "Decision Making", "Psychology"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-047",
            "isbn": "978-0807014295",
            "title": "Man's Search for Meaning",
            "author": "Viktor E. Frankl",
            "publisher": "Beacon Press",
            "year": 2006,
            "category": "Psychology",
            "shelfLocation": "Stack 4, Shelf Y-04",
            "totalCopies": 11,
            "availableCopies": 7,
            "description": "Psychiatrist Viktor Frankl's profound memoir of surviving concentration camps and the founding of Logotherapy — the quest for purpose and meaning.",
            "accentColor": "#1B4332",
            "tags": ["Logotherapy", "Existential Psychology", "Resilience", "Classic"],
            "rating": 5.0,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-048",
            "isbn": "978-0684853765",
            "title": "The Man Who Mistook His Wife for a Hat",
            "author": "Oliver Sacks",
            "publisher": "Touchstone",
            "year": 1998,
            "category": "Psychology",
            "shelfLocation": "Stack 4, Shelf Y-07",
            "totalCopies": 8,
            "availableCopies": 4,
            "description": "Neurologist Oliver Sacks' fascinating clinical case histories illuminating perceptual agnosias, memory loss, Tourette syndrome, and musical hallucinations.",
            "accentColor": "#2D6554",
            "tags": ["Neurology", "Clinical Psychology", "Neuroscience", "Case Studies"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-049",
            "isbn": "978-0061241895",
            "title": "Influence: The Psychology of Persuasion",
            "author": "Robert B. Cialdini",
            "publisher": "Harper Business",
            "year": 2006,
            "category": "Psychology",
            "shelfLocation": "Stack 4, Shelf Y-10",
            "totalCopies": 10,
            "availableCopies": 5,
            "description": "The foundational study on the six universal psychological principles of ethical and unethical persuasion: reciprocity, commitment, social proof, and authority.",
            "accentColor": "#183D32",
            "tags": ["Social Psychology", "Persuasion", "Behavioral Science"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-050",
            "isbn": "978-0735211292",
            "title": "Atomic Habits",
            "author": "James Clear",
            "publisher": "Avery",
            "year": 2018,
            "category": "Psychology",
            "shelfLocation": "Stack 4, Shelf Y-12",
            "totalCopies": 15,
            "availableCopies": 6,
            "description": "A scientific, practical framework for breaking destructive routines and building positive compounding daily habits through cue, craving, response, and reward.",
            "accentColor": "#102B24",
            "tags": ["Habits", "Behavioral Psychology", "Self-Improvement", "Bestseller"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },

        # --- ECONOMICS, FINANCE & BUSINESS ---
        {
            "id": "b-051",
            "isbn": "978-0553585971",
            "title": "The Wealth of Nations",
            "author": "Adam Smith",
            "publisher": "Bantam Classics",
            "year": 2003,
            "category": "Economics & Business",
            "shelfLocation": "Stack 2, Shelf E-01",
            "totalCopies": 8,
            "availableCopies": 4,
            "description": "The landmark 1776 economic treatise establishing division of labor, productivity, free markets, trade dynamics, and the metaphorical invisible hand.",
            "accentColor": "#1B4332",
            "tags": ["Classical Economics", "Adam Smith", "Free Markets", "Foundational"],
            "rating": 4.7,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-052",
            "isbn": "978-0060555665",
            "title": "The Intelligent Investor",
            "author": "Benjamin Graham (With Commentary by Jason Zweig)",
            "publisher": "Harper Business",
            "year": 2006,
            "category": "Economics & Business",
            "shelfLocation": "Stack 2, Shelf E-04",
            "totalCopies": 11,
            "availableCopies": 5,
            "description": "Warren Buffett's favorite investment guide on value investing, risk minimization, margin of safety, and emotional discipline in capital markets.",
            "accentColor": "#2D6554",
            "tags": ["Value Investing", "Finance", "Markets", "Capital"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-053",
            "isbn": "978-0674975422",
            "title": "Capital in the Twenty-First Century",
            "author": "Thomas Piketty",
            "publisher": "Belknap Press",
            "year": 2017,
            "category": "Economics & Business",
            "shelfLocation": "Stack 2, Shelf E-07",
            "totalCopies": 7,
            "availableCopies": 3,
            "description": "Rigorous macroeconomic historical analysis examining wealth concentration, return on capital vs economic growth (r > g), and progressive taxation.",
            "accentColor": "#183D32",
            "tags": ["Macroeconomics", "Inequality", "Capital", "Modern Economics"],
            "rating": 4.6,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-054",
            "isbn": "978-0060731335",
            "title": "Freakonomics",
            "author": "Steven D. Levitt & Stephen J. Dubner",
            "publisher": "William Morrow",
            "year": 2005,
            "category": "Economics & Business",
            "shelfLocation": "Stack 2, Shelf E-10",
            "totalCopies": 12,
            "availableCopies": 7,
            "description": "Rogue microeconomic analysis applying data incentives and correlation studies to real-world riddles, sumo wrestling, crime drop, and parenting.",
            "accentColor": "#102B24",
            "tags": ["Microeconomics", "Data Analysis", "Incentives", "Popular Science"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-055",
            "isbn": "978-0804139298",
            "title": "Zero to One: Notes on Startups",
            "author": "Peter Thiel with Blake Masters",
            "publisher": "Crown Business",
            "year": 2014,
            "category": "Economics & Business",
            "shelfLocation": "Stack 2, Shelf E-12",
            "totalCopies": 10,
            "availableCopies": 5,
            "description": "Contrarian startup philosophy on building proprietary monopolies through vertical technology leaps from zero to one rather than horizontal copying.",
            "accentColor": "#1B4332",
            "tags": ["Startups", "Innovation", "Technology", "Venture Capital"],
            "rating": 4.8,
            "isFeatured": True,
            "status": "active",
        },

        # --- LAW, POLITICS & GOVERNMENT ---
        {
            "id": "b-056",
            "isbn": "978-0199535699",
            "title": "The Prince",
            "author": "Niccolò Machiavelli",
            "publisher": "Oxford World's Classics",
            "year": 2008,
            "category": "Law & Politics",
            "shelfLocation": "Stack 6, Shelf G-01",
            "totalCopies": 9,
            "availableCopies": 4,
            "description": "The seminal Renaissance treatise on pragmatic political realism, statecraft, fortune (fortuna), virtue (virtù), and the preservation of sovereign power.",
            "accentColor": "#2D6554",
            "tags": ["Political Realism", "Statecraft", "Renaissance", "Classic"],
            "rating": 4.8,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-057",
            "isbn": "978-0140442014",
            "title": "The Social Contract",
            "author": "Jean-Jacques Rousseau",
            "publisher": "Penguin Classics",
            "year": 1968,
            "category": "Law & Politics",
            "shelfLocation": "Stack 6, Shelf G-04",
            "totalCopies": 7,
            "availableCopies": 3,
            "description": "'Man is born free, and everywhere he is in chains.' Rousseau's revolutionary vision of popular sovereignty, civic liberty, and the general will.",
            "accentColor": "#183D32",
            "tags": ["Political Philosophy", "Democracy", "Enlightenment", "Law"],
            "rating": 4.7,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-058",
            "isbn": "978-0451528810",
            "title": "The Federalist Papers",
            "author": "Alexander Hamilton, James Madison & John Jay",
            "publisher": "Signet Classics",
            "year": 2003,
            "category": "Law & Politics",
            "shelfLocation": "Stack 6, Shelf G-07",
            "totalCopies": 8,
            "availableCopies": 5,
            "description": "85 brilliant essays defending constitutional separation of powers, judicial review, republican governance, and federal checks and balances.",
            "accentColor": "#102B24",
            "tags": ["Constitutional Law", "Governance", "American Politics", "History"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-059",
            "isbn": "978-0374532512",
            "title": "Justice: What's the Right Thing to Do?",
            "author": "Michael J. Sandel",
            "publisher": "Farrar, Straus and Giroux",
            "year": 2010,
            "category": "Law & Politics",
            "shelfLocation": "Stack 6, Shelf G-10",
            "totalCopies": 10,
            "availableCopies": 6,
            "description": "Harvard professor Michael Sandel's electrifying journey through utilitarianism, libertarianism, Kantian duty, affirmative action, and civic virtue.",
            "accentColor": "#1B4332",
            "tags": ["Jurisprudence", "Ethics", "Justice", "Political Philosophy"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },

        # --- ARTS, ARCHITECTURE & DESIGN ---
        {
            "id": "b-060",
            "isbn": "978-0465050659",
            "title": "The Design of Everyday Things",
            "author": "Don Norman",
            "publisher": "Basic Books",
            "year": 2013,
            "category": "Arts & Design",
            "shelfLocation": "Stack 2, Shelf A-01",
            "totalCopies": 12,
            "availableCopies": 6,
            "description": "The cognitive design masterpiece on usability, affordances, mental models, signifiers, and why human-centered design matters in doors, products, and software.",
            "accentColor": "#2D6554",
            "tags": ["UX Design", "HCI", "Industrial Design", "Product"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-061",
            "isbn": "978-0714832470",
            "title": "The Story of Art",
            "author": "E. H. Gombrich",
            "publisher": "Phaidon Press",
            "year": 1995,
            "category": "Arts & Design",
            "shelfLocation": "Stack 2, Shelf A-05",
            "totalCopies": 6,
            "availableCopies": 3,
            "description": "The world's most famous introduction to art history, spanning cave paintings, Classical sculpture, the Italian Renaissance, Impressionism, and Modernism.",
            "accentColor": "#183D32",
            "tags": ["Art History", "Renaissance", "Aesthetics", "Visual Arts"],
            "rating": 4.9,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-062",
            "isbn": "978-0140135152",
            "title": "Ways of Seeing",
            "author": "John Berger",
            "publisher": "Penguin Books",
            "year": 1990,
            "category": "Arts & Design",
            "shelfLocation": "Stack 2, Shelf A-08",
            "totalCopies": 8,
            "availableCopies": 4,
            "description": "Landmark BBC critique demonstrating how visual media, classical oil painting, advertising, and gender gaze shape cultural perception.",
            "accentColor": "#102B24",
            "tags": ["Art Criticism", "Visual Culture", "Semiotics", "Media Studies"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },

        # --- MEDICINE, BIOLOGY & HEALTH ---
        {
            "id": "b-063",
            "isbn": "978-1439170915",
            "title": "The Emperor of All Maladies: A Biography of Cancer",
            "author": "Siddhartha Mukherjee",
            "publisher": "Scribner",
            "year": 2010,
            "category": "Medicine & Health",
            "shelfLocation": "Stack 1, Shelf M-01",
            "totalCopies": 10,
            "availableCopies": 5,
            "description": "Pulitzer Prize-winning clinical biography of cancer spanning ancient Persian mastectomy, cellular genetics, radiation therapy, and targeted immunotherapy.",
            "accentColor": "#1B4332",
            "tags": ["Medicine", "Oncology", "Pulitzer Prize", "Cell Biology"],
            "rating": 5.0,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-064",
            "isbn": "978-1476733524",
            "title": "The Gene: An Intimate History",
            "author": "Siddhartha Mukherjee",
            "publisher": "Scribner",
            "year": 2016,
            "category": "Medicine & Health",
            "shelfLocation": "Stack 1, Shelf M-04",
            "totalCopies": 9,
            "availableCopies": 4,
            "description": "A magisterial exploration of hereditary genetics from Mendel's pea plants and Watson & Crick's double helix to CRISPR-Cas9 gene editing.",
            "accentColor": "#2D6554",
            "tags": ["Genetics", "Biology", "Molecular Biology", "CRISPR"],
            "rating": 4.9,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-065",
            "isbn": "978-0812988406",
            "title": "When Breath Becomes Air",
            "author": "Paul Kalanithi",
            "publisher": "Random House",
            "year": 2016,
            "category": "Medicine & Health",
            "shelfLocation": "Stack 1, Shelf M-08",
            "totalCopies": 11,
            "availableCopies": 6,
            "description": "Neurosurgeon Paul Kalanithi's unforgettable memoir confronting terminal lung cancer, examining what makes human life meaningful in the face of mortality.",
            "accentColor": "#183D32",
            "tags": ["Neuroscience", "Memoir", "Medical Ethics", "Bestseller"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-066",
            "isbn": "978-0199291151",
            "title": "The Selfish Gene",
            "author": "Richard Dawkins",
            "publisher": "Oxford University Press",
            "year": 2006,
            "category": "Medicine & Health",
            "shelfLocation": "Stack 1, Shelf M-11",
            "totalCopies": 8,
            "availableCopies": 4,
            "description": "The groundbreaking evolutionary thesis shifting focus from organisms to replicating genes, coining the concept of memes and kin selection.",
            "accentColor": "#102B24",
            "tags": ["Evolutionary Biology", "Genetics", "Natural Selection"],
            "rating": 4.7,
            "isFeatured": False,
            "status": "active",
        },

        # --- WORLD LITERATURE & CLASSICS ---
        {
            "id": "b-067",
            "isbn": "978-0140449136",
            "title": "Crime and Punishment",
            "author": "Fyodor Dostoevsky (Translated by Richard Pevear & Larissa Volokhonsky)",
            "publisher": "Penguin Classics",
            "year": 2003,
            "category": "Literature",
            "shelfLocation": "Stack 5, Shelf L-10",
            "totalCopies": 10,
            "availableCopies": 6,
            "description": "Dostoevsky's psychological summit following impoverished student Raskolnikov's murder of an old pawnbroker and his agonizing path toward redemption.",
            "accentColor": "#1B4332",
            "tags": ["Russian Literature", "Psychological Fiction", "Classic"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-068",
            "isbn": "978-0393356250",
            "title": "The Odyssey",
            "author": "Homer (Translated by Emily Wilson)",
            "publisher": "W. W. Norton & Company",
            "year": 2018,
            "category": "Literature",
            "shelfLocation": "Stack 5, Shelf L-14",
            "totalCopies": 9,
            "availableCopies": 5,
            "description": "Emily Wilson's acclaimed iambic translation of Odysseus's ten-year voyage home from Troy through monsters, sirens, sorceresses, and Ithacan suitors.",
            "accentColor": "#2D6554",
            "tags": ["Epic Poetry", "Homer", "Ancient Greece", "Mythology"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-069",
            "isbn": "978-0060883287",
            "title": "One Hundred Years of Solitude",
            "author": "Gabriel García Márquez",
            "publisher": "Harper Perennial",
            "year": 2006,
            "category": "Literature",
            "shelfLocation": "Stack 5, Shelf L-18",
            "totalCopies": 11,
            "availableCopies": 6,
            "description": "The crowning achievement of magical realism tracing seven generations of the Buendía family in the mythical town of Macondo.",
            "accentColor": "#183D32",
            "tags": ["Magical Realism", "Latin American Literature", "Nobel Prize"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-070",
            "isbn": "978-0141439518",
            "title": "Pride and Prejudice",
            "author": "Jane Austen",
            "publisher": "Penguin Classics",
            "year": 2002,
            "category": "Literature",
            "shelfLocation": "Stack 5, Shelf L-22",
            "totalCopies": 10,
            "availableCopies": 7,
            "description": "Jane Austen's sparkling comedy of manners chronicling Elizabeth Bennet and Mr. Darcy's tempestuous journey through pride, prejudice, and social class.",
            "accentColor": "#102B24",
            "tags": ["British Classics", "Jane Austen", "Romance", "Social Satire"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },

        # --- WORLD HISTORY & ARCHAEOLOGY ---
        {
            "id": "b-071",
            "isbn": "978-1101912379",
            "title": "The Silk Roads: A New History of the World",
            "author": "Peter Frankopan",
            "publisher": "Vintage",
            "year": 2017,
            "category": "History",
            "shelfLocation": "Stack 5, Shelf H-10",
            "totalCopies": 9,
            "availableCopies": 5,
            "description": "A paradigm-shifting history reorienting world civilization away from the Atlantic West toward Central Asia and the trade arteries that linked East and West.",
            "accentColor": "#1B4332",
            "tags": ["World History", "Silk Road", "Trade", "Asia"],
            "rating": 4.8,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-072",
            "isbn": "978-1631492228",
            "title": "SPQR: A History of Ancient Rome",
            "author": "Mary Beard",
            "publisher": "Liveright",
            "year": 2016,
            "category": "History",
            "shelfLocation": "Stack 5, Shelf H-14",
            "totalCopies": 8,
            "availableCopies": 4,
            "description": "Cambridge classicist Mary Beard explores how Rome transformed from an unremarkable iron-age village into a global superpower spanning three continents.",
            "accentColor": "#2D6554",
            "tags": ["Ancient Rome", "Classical History", "Archaeology"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },

        # --- MATHEMATICS & LOGIC ---
        {
            "id": "b-073",
            "isbn": "978-0465026562",
            "title": "Gödel, Escher, Bach: An Eternal Golden Braid",
            "author": "Douglas R. Hofstadter",
            "publisher": "Basic Books",
            "year": 1999,
            "category": "Mathematics",
            "shelfLocation": "Stack 2, Shelf D-06",
            "totalCopies": 7,
            "availableCopies": 3,
            "description": "Pulitzer Prize-winning masterpiece interweaving Kurt Gödel's incompleteness theorems, M.C. Escher's illusions, and J.S. Bach's fugues to illuminate conscious minds.",
            "accentColor": "#183D32",
            "tags": ["Mathematical Logic", "Cognitive Science", "Pulitzer Prize", "Artificial Intelligence"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-074",
            "isbn": "978-0143125082",
            "title": "The Signal and the Noise",
            "author": "Nate Silver",
            "publisher": "Penguin Books",
            "year": 2015,
            "category": "Mathematics",
            "shelfLocation": "Stack 2, Shelf D-09",
            "totalCopies": 9,
            "availableCopies": 5,
            "description": "Statistician Nate Silver investigates why predictions fail across politics, meteorology, poker, earthquakes, and financial crashes, advocating Bayesian probability.",
            "accentColor": "#102B24",
            "tags": ["Statistics", "Forecasting", "Bayesian", "Probability"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-075",
            "isbn": "978-0980232776",
            "title": "Linear Algebra and Learning from Data",
            "author": "Gilbert Strang",
            "publisher": "Wellesley-Cambridge Press",
            "year": 2019,
            "category": "Mathematics",
            "shelfLocation": "Stack 2, Shelf D-12",
            "totalCopies": 10,
            "availableCopies": 6,
            "description": "MIT Professor Gilbert Strang's foundational linear algebra textbook tailored for modern machine learning, deep neural nets, and SVD decomposition.",
            "accentColor": "#1B4332",
            "tags": ["Linear Algebra", "MIT", "Data Science", "Machine Learning"],
            "rating": 4.9,
            "isFeatured": True,
            "status": "active",
        },

        # --- ENGINEERING & TECHNOLOGY ---
        {
            "id": "b-076",
            "isbn": "978-0306812835",
            "title": "Structures: Or Why Things Don't Fall Down",
            "author": "J. E. Gordon",
            "publisher": "Da Capo Press",
            "year": 2003,
            "category": "Engineering",
            "shelfLocation": "Stack 2, Shelf N-01",
            "totalCopies": 8,
            "availableCopies": 4,
            "description": "A witty, readable introduction to structural engineering, stress, strain, fracture mechanics, and why suspension bridges and cathedrals withstand collapse.",
            "accentColor": "#2D6554",
            "tags": ["Structural Engineering", "Materials Science", "Mechanics", "Classic"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
        {
            "id": "b-077",
            "isbn": "978-0521809269",
            "title": "The Art of Electronics",
            "author": "Paul Horowitz & Winfield Hill",
            "publisher": "Cambridge University Press",
            "year": 2015,
            "category": "Engineering",
            "shelfLocation": "Stack 2, Shelf N-04",
            "totalCopies": 7,
            "availableCopies": 3,
            "description": "The worldwide electrical engineering bible on analog circuit design, op-amps, microcontrollers, digital logic, and low-noise instrumentation.",
            "accentColor": "#183D32",
            "tags": ["Electrical Engineering", "Circuit Design", "Hardware", "Reference"],
            "rating": 5.0,
            "isFeatured": True,
            "status": "active",
        },
        {
            "id": "b-078",
            "isbn": "978-0073398204",
            "title": "Shigley's Mechanical Engineering Design",
            "author": "Richard G. Budynas & J. Keith Nisbett",
            "publisher": "McGraw-Hill",
            "year": 2014,
            "category": "Engineering",
            "shelfLocation": "Stack 2, Shelf N-07",
            "totalCopies": 8,
            "availableCopies": 4,
            "description": "The definitive mechanical engineering textbook on fatigue analysis, shafts, gears, bearings, fasteners, and finite element failure theories.",
            "accentColor": "#102B24",
            "tags": ["Mechanical Engineering", "Machine Design", "Materials"],
            "rating": 4.8,
            "isFeatured": False,
            "status": "active",
        },
    ]

    for b in raw_seed:
        b["copies"] = _generate_default_copies(b["id"], b["totalCopies"], b["availableCopies"], b["shelfLocation"])
        b["createdAt"] = "2026-01-01T00:00:00Z"
        b["updatedAt"] = "2026-01-01T00:00:00Z"
        _in_memory_books[b["id"]] = b

    _seeded = True


# Seed once at module import
_seed_initial_books()


def get_books_collection():
    """Returns MongoDB books collection if connected, else None."""
    try:
        uri = current_app.config.get("MONGODB_URI", "")
        db_name = current_app.config.get("MONGODB_DB_NAME", "scholars_shelf")
        timeout_ms = current_app.config.get("MONGODB_TIMEOUT_MS", 2000)
        client = get_mongo_client(uri, timeout_ms=timeout_ms)
        if client is not None:
            col = client[db_name]["books"]
            try:
                if col.count_documents({}) < len(_in_memory_books):
                    for b in _in_memory_books.values():
                        col.update_one({"id": b["id"]}, {"$setOnInsert": dict(b)}, upsert=True)
            except Exception:
                pass
            return col
    except Exception:
        pass
    return None


def sanitize_book(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Cleans MongoDB document formatting, ensuring string id."""
    if not doc:
        return {}
    clean = dict(doc)
    if "_id" in clean and "id" not in clean:
        clean["id"] = str(clean.pop("_id"))
    elif "_id" in clean:
        clean.pop("_id")
    return clean


def get_all_books(
    search: Optional[str] = None,
    category: Optional[str] = None,
    available_only: bool = False,
    sort_by: Optional[str] = None,
    include_archived: bool = False,
) -> List[Dict[str, Any]]:
    """
    Retrieves catalogued books matching search query, category, and availability filters.
    """
    col = get_books_collection()
    if col is not None:
        try:
            query: Dict[str, Any] = {}
            if not include_archived:
                query["status"] = {"$ne": "archived"}
            if category and category != "All Categories":
                query["category"] = category
            if available_only:
                query["availableCopies"] = {"$gt": 0}
            if search:
                regex = {"$regex": search, "$options": "i"}
                query["$or"] = [
                    {"title": regex},
                    {"author": regex},
                    {"isbn": regex},
                    {"category": regex},
                    {"tags": regex},
                    {"shelfLocation": regex},
                ]

            cursor = col.find(query)
            # Sort order
            if sort_by == "year_desc":
                cursor = cursor.sort("year", -1)
            elif sort_by == "year_asc":
                cursor = cursor.sort("year", 1)
            elif sort_by == "title_asc":
                cursor = cursor.sort("title", 1)
            elif sort_by == "rating_desc":
                cursor = cursor.sort("rating", -1)

            results = [sanitize_book(b) for b in cursor]
            if results:
                return results
        except Exception:
            pass

    # In-memory fallback
    books = list(_in_memory_books.values())
    if not include_archived:
        books = [b for b in books if b.get("status") != "archived"]

    if category and category != "All Categories":
        books = [b for b in books if b.get("category") == category]

    if available_only:
        books = [b for b in books if b.get("availableCopies", 0) > 0]

    if search:
        s = search.lower()
        books = [
            b for b in books
            if s in b.get("title", "").lower()
            or s in b.get("author", "").lower()
            or s in b.get("isbn", "").lower()
            or s in b.get("category", "").lower()
            or any(s in tag.lower() for tag in b.get("tags", []))
            or s in b.get("shelfLocation", "").lower()
        ]

    if sort_by == "year_desc":
        books.sort(key=lambda x: x.get("year", 0), reverse=True)
    elif sort_by == "year_asc":
        books.sort(key=lambda x: x.get("year", 0))
    elif sort_by == "title_asc":
        books.sort(key=lambda x: x.get("title", "").lower())
    elif sort_by == "rating_desc":
        books.sort(key=lambda x: x.get("rating", 0), reverse=True)

    return [sanitize_book(b) for b in books]


def get_book_by_id(book_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single book record by ID."""
    if not book_id:
        return None

    col = get_books_collection()
    if col is not None:
        try:
            doc = col.find_one({"id": book_id}) or col.find_one({"_id": book_id})
            if doc:
                return sanitize_book(doc)
        except Exception:
            pass

    book = _in_memory_books.get(book_id)
    return sanitize_book(book) if book else None


def get_book_by_isbn(isbn: str) -> Optional[Dict[str, Any]]:
    """Looks up a book by its ISBN (ignoring hyphens)."""
    clean_isbn = isbn.replace("-", "").strip()

    col = get_books_collection()
    if col is not None:
        try:
            doc = col.find_one({"isbn": isbn.strip()})
            if doc:
                return sanitize_book(doc)
        except Exception:
            pass

    for b in _in_memory_books.values():
        if b.get("isbn", "").replace("-", "").strip() == clean_isbn:
            return sanitize_book(b)
    return None


def create_book(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a new catalogued book record with generated individual copy records.
    Prevents duplicate ISBNs and negative copies.
    """
    book_id = f"b-{uuid.uuid4().hex[:6]}"
    total_copies = int(data.get("totalCopies", 1))
    if total_copies < 1:
        total_copies = 1

    available_copies = int(data.get("availableCopies", total_copies))
    if available_copies > total_copies:
        available_copies = total_copies
    if available_copies < 0:
        available_copies = 0

    shelf_location = data.get("shelfLocation", "Stack 1, Shelf A-01").strip()

    # Generate individual copy units
    copies = _generate_default_copies(book_id, total_copies, available_copies, shelf_location)

    now_iso = datetime.now(timezone.utc).isoformat()
    new_book = {
        "id": book_id,
        "isbn": data.get("isbn", "").strip(),
        "title": data.get("title", "").strip(),
        "author": data.get("author", "").strip(),
        "publisher": data.get("publisher", "University Press").strip(),
        "year": int(data.get("year", datetime.now().year)),
        "category": data.get("category", "Computer Science").strip(),
        "shelfLocation": shelf_location,
        "totalCopies": total_copies,
        "availableCopies": available_copies,
        "description": data.get("description", "").strip(),
        "coverImage": data.get("coverImage"),
        "accentColor": data.get("accentColor", "#183D32"),
        "tags": data.get("tags") if isinstance(data.get("tags"), list) else ["Acquisition"],
        "rating": float(data.get("rating", 5.0)),
        "isFeatured": bool(data.get("isFeatured", False)),
        "status": "active",
        "copies": copies,
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }

    col = get_books_collection()
    if col is not None:
        try:
            col.insert_one(dict(new_book))
        except Exception:
            pass

    _in_memory_books[book_id] = new_book
    return sanitize_book(new_book)


def update_book(book_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Updates an existing book metadata and adjusts copies if needed."""
    existing = get_book_by_id(book_id)
    if not existing:
        return None

    # Merge fields
    fields_to_update = [
        "title", "author", "publisher", "year", "category", "shelfLocation",
        "description", "coverImage", "accentColor", "tags", "isFeatured", "status"
    ]

    for field in fields_to_update:
        if field in data:
            existing[field] = data[field]

    # Handle total copies adjustments safely
    if "totalCopies" in data:
        new_total = int(data["totalCopies"])
        if new_total < 0:
            new_total = 0

        current_total = existing.get("totalCopies", 0)
        current_available = existing.get("availableCopies", 0)
        borrowed_count = current_total - current_available

        if new_total < borrowed_count:
            # Cannot reduce total below actively checked-out copies!
            raise ValueError(f"Cannot reduce total copies to {new_total}; {borrowed_count} copies are currently checked out.")

        diff = new_total - current_total
        existing["totalCopies"] = new_total
        existing["availableCopies"] = max(0, current_available + diff)

        # Sync copy list
        existing_copies = existing.get("copies", [])
        if diff > 0:
            for i in range(current_total + 1, new_total + 1):
                copy_num = f"{i:02d}"
                existing_copies.append({
                    "copyId": f"CPY-{book_id}-{copy_num}",
                    "bookId": book_id,
                    "copyNumber": i,
                    "status": "available",
                    "shelfLocation": existing.get("shelfLocation", "Stack 1"),
                    "barcode": f"SCHOLARS-COPY-{book_id}-{copy_num}",
                    "addedAt": datetime.now(timezone.utc).isoformat(),
                })
        elif diff < 0:
            # Remove only available copies from the end
            copies_to_remove = abs(diff)
            new_copies = []
            removed = 0
            for copy in reversed(existing_copies):
                if copy.get("status") == "available" and removed < copies_to_remove:
                    removed += 1
                else:
                    new_copies.append(copy)
            existing_copies = list(reversed(new_copies))

        existing["copies"] = existing_copies

    existing["updatedAt"] = datetime.now(timezone.utc).isoformat()

    col = get_books_collection()
    if col is not None:
        try:
            col.update_one({"id": book_id}, {"$set": existing})
        except Exception:
            pass

    _in_memory_books[book_id] = existing
    return sanitize_book(existing)


def archive_book(book_id: str) -> Optional[Dict[str, Any]]:
    """Soft archives a book, removing it from standard public catalogue."""
    return update_book(book_id, {"status": "archived"})


def add_single_copy(book_id: str, copy_id: Optional[str] = None, shelf_location: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Adds a single inventory copy to a book."""
    book = get_book_by_id(book_id)
    if not book:
        return None

    existing_copies = book.get("copies", [])
    copy_number = len(existing_copies) + 1
    new_copy_id = copy_id.strip() if copy_id else f"CPY-{book_id}-{copy_number:02d}"

    # Verify copy ID is not already used in this book
    if any(c.get("copyId") == new_copy_id for c in existing_copies):
        raise ValueError(f"Copy ID '{new_copy_id}' already exists for this book.")

    shelf = shelf_location.strip() if shelf_location else book.get("shelfLocation", "Stack 1")

    new_copy = {
        "copyId": new_copy_id,
        "bookId": book_id,
        "copyNumber": copy_number,
        "status": "available",
        "shelfLocation": shelf,
        "barcode": f"SCHOLARS-COPY-{new_copy_id}",
        "addedAt": datetime.now(timezone.utc).isoformat(),
    }

    existing_copies.append(new_copy)
    book["copies"] = existing_copies
    book["totalCopies"] = book.get("totalCopies", 0) + 1
    book["availableCopies"] = book.get("availableCopies", 0) + 1
    book["updatedAt"] = datetime.now(timezone.utc).isoformat()

    col = get_books_collection()
    if col is not None:
        try:
            col.update_one({"id": book_id}, {"$set": book})
        except Exception:
            pass

    _in_memory_books[book_id] = book
    return new_copy


def remove_single_copy(book_id: str, copy_id: str) -> Optional[Dict[str, Any]]:
    """Removes a specific copy if not currently borrowed."""
    book = get_book_by_id(book_id)
    if not book:
        return None

    existing_copies = book.get("copies", [])
    target = None
    for c in existing_copies:
        if c.get("copyId") == copy_id:
            target = c
            break

    if not target:
        raise ValueError(f"Copy with ID '{copy_id}' not found.")

    if target.get("status") == "borrowed":
        raise ValueError(f"Cannot remove copy '{copy_id}' because it is currently checked out to a borrower.")

    book["copies"] = [c for c in existing_copies if c.get("copyId") != copy_id]
    book["totalCopies"] = max(0, book.get("totalCopies", 0) - 1)
    if target.get("status") == "available":
        book["availableCopies"] = max(0, book.get("availableCopies", 0) - 1)
    book["updatedAt"] = datetime.now(timezone.utc).isoformat()

    col = get_books_collection()
    if col is not None:
        try:
            col.update_one({"id": book_id}, {"$set": book})
        except Exception:
            pass

    _in_memory_books[book_id] = book
    return target


def generate_qr_data_url(content: str) -> str:
    """Generates a high-quality base64 PNG data URL QR code."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=3,
    )
    qr.add_data(content)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#183D32", back_color="#F8F5EC")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"


def lookup_by_qr_or_code(code_string: str) -> Optional[Dict[str, Any]]:
    """
    Looks up a book and specific copy by QR string, barcode, copyId, or ISBN.
    Matches strings like:
      - 'SCHOLARS-COPY-b-001-01'
      - 'CPY-b-001-01'
      - 'b-001'
      - '978-0131103627'
    """
    raw = code_string.strip()
    if not raw:
        return None

    # Check direct book ID
    direct_book = get_book_by_id(raw)
    if direct_book:
        return {
            "type": "book",
            "book": direct_book,
            "matchedCopy": direct_book.get("copies", [])[0] if direct_book.get("copies") else None,
        }

    # Check ISBN
    isbn_book = get_book_by_isbn(raw)
    if isbn_book:
        return {
            "type": "book",
            "book": isbn_book,
            "matchedCopy": isbn_book.get("copies", [])[0] if isbn_book.get("copies") else None,
        }

    # Check copyId or barcode across all books
    all_books = get_all_books(include_archived=True)
    for b in all_books:
        for copy in b.get("copies", []):
            if (
                copy.get("copyId") == raw
                or copy.get("barcode") == raw
                or f"SCHOLARS-COPY-{copy.get('copyId')}" == raw
            ):
                return {
                    "type": "copy",
                    "book": b,
                    "matchedCopy": copy,
                }

    return None


def checkout_book_copy(book_id: str, copy_id: Optional[str] = None):
    """
    Checks out a copy unit of a book:
    - Finds book and verifies available copies > 0
    - Finds specified copy or first available copy
    - Marks copy status as 'borrowed'
    - Decrements availableCopies by 1
    - Persists change in MongoDB and memory
    - Returns (updated_book, checked_out_copy)
    """
    book = get_book_by_id(book_id)
    if not book:
        raise ValueError(f"Book with ID '{book_id}' not found.")

    copies = book.get("copies", [])
    target_copy = None

    if copy_id:
        for c in copies:
            if c.get("copyId") == copy_id:
                if c.get("status") != "available":
                    raise ValueError(f"Copy '{copy_id}' is currently '{c.get('status')}' and cannot be checked out.")
                target_copy = c
                break
        if not target_copy:
            raise ValueError(f"Copy with ID '{copy_id}' not found in volume '{book.get('title')}'.")
    else:
        for c in copies:
            if c.get("status") == "available":
                target_copy = c
                break
        if not target_copy:
            raise ValueError(f"No copies of '{book.get('title')}' are currently available for checkout.")

    target_copy["status"] = "borrowed"
    book["availableCopies"] = max(0, book.get("availableCopies", 1) - 1)
    book["updatedAt"] = datetime.now(timezone.utc).isoformat()

    col = get_books_collection()
    if col is not None:
        try:
            col.update_one({"id": book_id}, {"$set": {"copies": copies, "availableCopies": book["availableCopies"], "updatedAt": book["updatedAt"]}})
        except Exception:
            pass

    _in_memory_books[book_id] = book
    return sanitize_book(book), target_copy


def return_book_copy(book_id: str, copy_id: str):
    """
    Returns a copy unit of a book:
    - Sets copy status to 'available'
    - Increments availableCopies
    - Persists change in MongoDB and memory
    - Returns (updated_book, returned_copy)
    """
    book = get_book_by_id(book_id)
    if not book:
        raise ValueError(f"Book with ID '{book_id}' not found.")

    copies = book.get("copies", [])
    target_copy = None
    for c in copies:
        if c.get("copyId") == copy_id:
            target_copy = c
            break

    if not target_copy:
        raise ValueError(f"Copy '{copy_id}' not found in volume '{book.get('title')}'.")

    target_copy["status"] = "available"
    total = book.get("totalCopies", len(copies))
    book["availableCopies"] = min(total, book.get("availableCopies", 0) + 1)
    book["updatedAt"] = datetime.now(timezone.utc).isoformat()

    col = get_books_collection()
    if col is not None:
        try:
            col.update_one({"id": book_id}, {"$set": {"copies": copies, "availableCopies": book["availableCopies"], "updatedAt": book["updatedAt"]}})
        except Exception:
            pass

    _in_memory_books[book_id] = book
    return sanitize_book(book), target_copy


def reserve_book_copy(book_id: str, copy_id: str):
    """Marks a specific copy as 'reserved' for pickup."""
    book = get_book_by_id(book_id)
    if not book:
        return None, None

    copies = book.get("copies", [])
    target_copy = None
    for c in copies:
        if c.get("copyId") == copy_id:
            target_copy = c
            break

    if not target_copy:
        return None, None

    target_copy["status"] = "reserved"
    book["availableCopies"] = max(0, book.get("availableCopies", 1) - 1)
    book["updatedAt"] = datetime.now(timezone.utc).isoformat()

    col = get_books_collection()
    if col is not None:
        try:
            col.update_one({"id": book_id}, {"$set": {"copies": copies, "availableCopies": book["availableCopies"], "updatedAt": book["updatedAt"]}})
        except Exception:
            pass

    _in_memory_books[book_id] = book
    return sanitize_book(book), target_copy

