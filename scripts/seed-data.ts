/**
 * Sample data for US-23 (GB-40). Used by scripts/seed.ts and checked by tests/seed/seed-data.test.ts.
 *
 * - Books are listed OLDEST FIRST: the seed gives book i the timestamp SEED_BASE_DATE + i days,
 *   so every book has a different `created_at` and "newest first" is deterministic (AC B1).
 * - Prices are integers in VND (> 0). Three books have stock = 0 to test "Sold Out" (AC M2).
 * - Covers come from the Open Library Covers API (stable public URLs, looked up by ISBN).
 *   `?default=false` makes a missing cover return 404 instead of a blank image, so a broken link is visible.
 * - Descriptions are short summaries written by the team (not copied from publishers).
 */

export const SEED_BASE_DATE = "2026-09-01T09:00:00+07:00";

export const CATEGORIES = [
  "Fiction",
  "Fantasy & Science Fiction",
  "Children's Books",
  "Self-Help",
  "Business & Economics",
  "History & Science",
  "Biography & Memoir",
  "Technology",
] as const;

export type CategoryName = (typeof CATEGORIES)[number];

export type SeedBook = {
  title: string;
  author: string;
  category: CategoryName;
  price: number; // VND
  stock: number;
  isbn: string; // used only to build the cover URL
  description: string;
};

export function coverUrl(isbn: string): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
}

export const BOOKS: SeedBook[] = [
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    category: "Fiction",
    price: 95000,
    stock: 12,
    isbn: "9780141439518",
    description:
      "Elizabeth Bennet and the proud Mr. Darcy misjudge each other at every turn in this witty classic about love, class and first impressions in 19th-century England.",
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    category: "Fiction",
    price: 89000,
    stock: 8,
    isbn: "9780743273565",
    description:
      "A young narrator watches his mysterious, wealthy neighbour chase an old love across one glittering summer on Long Island during the Jazz Age.",
  },
  {
    title: "Nineteen Eighty-Four",
    author: "George Orwell",
    category: "Fiction",
    price: 110000,
    stock: 15,
    isbn: "9780451524935",
    description:
      "In a state where Big Brother watches everyone and history is rewritten daily, a low-level clerk begins to question the system he serves.",
  },
  {
    title: "Animal Farm",
    author: "George Orwell",
    category: "Fiction",
    price: 69000,
    stock: 20,
    isbn: "9780451526342",
    description:
      "The animals of a farm overthrow their human owner, only to see their new leaders slowly become what they fought against. A short fable about power.",
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    category: "Fiction",
    price: 125000,
    stock: 6,
    isbn: "9780061120084",
    description:
      "Through the eyes of a young girl in a small Alabama town, a lawyer's defence of a wrongly accused man exposes prejudice and quiet courage.",
  },
  {
    title: "Norwegian Wood",
    author: "Haruki Murakami",
    category: "Fiction",
    price: 145000,
    stock: 0,
    isbn: "9780375704024",
    description:
      "A man in his late thirties hears an old Beatles song and is carried back to his student years in Tokyo, a time of friendship, loss and first love.",
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    category: "Fiction",
    price: 99000,
    stock: 25,
    isbn: "9780062315007",
    description:
      "A shepherd boy leaves Spain to search for treasure near the Egyptian pyramids and learns to listen to his heart along the way.",
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    category: "Fantasy & Science Fiction",
    price: 159000,
    stock: 10,
    isbn: "9780547928227",
    description:
      "Bilbo Baggins, a comfort-loving hobbit, is swept into a quest with a wizard and thirteen dwarves to win back a treasure guarded by a dragon.",
  },
  {
    title: "The Fellowship of the Ring",
    author: "J.R.R. Tolkien",
    category: "Fantasy & Science Fiction",
    price: 189000,
    stock: 7,
    isbn: "9780547928210",
    description:
      "Frodo inherits a dangerous ring and sets out with eight companions to destroy it, beginning the journey of The Lord of the Rings.",
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    category: "Fantasy & Science Fiction",
    price: 199000,
    stock: 9,
    isbn: "9780441172719",
    description:
      "On the desert planet Arrakis, the only source of the most valuable substance in the universe, a noble family is betrayed and its heir must survive among the desert people.",
  },
  {
    title: "Foundation",
    author: "Isaac Asimov",
    category: "Fantasy & Science Fiction",
    price: 135000,
    stock: 11,
    isbn: "9780553293357",
    description:
      "A mathematician predicts the fall of a galactic empire and creates a plan to shorten the dark age that will follow.",
  },
  {
    title: "I, Robot",
    author: "Isaac Asimov",
    category: "Fantasy & Science Fiction",
    price: 119000,
    stock: 5,
    isbn: "9780553382563",
    description:
      "Linked short stories about robots bound by the Three Laws of Robotics, and the surprising ways those laws can go wrong.",
  },
  {
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    category: "Fantasy & Science Fiction",
    price: 175000,
    stock: 30,
    isbn: "9780590353427",
    description:
      "On his eleventh birthday, Harry learns he is a wizard and starts his first year at Hogwarts School of Witchcraft and Wizardry.",
  },
  {
    title: "Harry Potter and the Chamber of Secrets",
    author: "J.K. Rowling",
    category: "Fantasy & Science Fiction",
    price: 179000,
    stock: 0,
    isbn: "9780439064873",
    description:
      "In Harry's second year at Hogwarts, students are found petrified and a hidden chamber is said to have been opened again.",
  },
  {
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    category: "Children's Books",
    price: 79000,
    stock: 18,
    isbn: "9780156012195",
    description:
      "A pilot stranded in the desert meets a small prince from another planet who tells him about the places and people he has visited.",
  },
  {
    title: "Charlotte's Web",
    author: "E.B. White",
    category: "Children's Books",
    price: 85000,
    stock: 14,
    isbn: "9780064400558",
    description:
      "A clever spider named Charlotte writes words in her web to save her friend Wilbur, a young pig, from his fate.",
  },
  {
    title: "Matilda",
    author: "Roald Dahl",
    category: "Children's Books",
    price: 92000,
    stock: 9,
    isbn: "9780142410370",
    description:
      "A brilliant little girl with careless parents and a terrifying headmistress discovers she has an unusual power.",
  },
  {
    title: "Charlie and the Chocolate Factory",
    author: "Roald Dahl",
    category: "Children's Books",
    price: 92000,
    stock: 16,
    isbn: "9780142410318",
    description:
      "Charlie Bucket finds a golden ticket and wins a tour of Willy Wonka's mysterious chocolate factory with four other children.",
  },
  {
    title: "How to Win Friends and Influence People",
    author: "Dale Carnegie",
    category: "Self-Help",
    price: 105000,
    stock: 22,
    isbn: "9780671027032",
    description:
      "Practical advice, illustrated with stories, on getting along with people, making them like you and persuading without arguing.",
  },
  {
    title: "The 7 Habits of Highly Effective People",
    author: "Stephen R. Covey",
    category: "Self-Help",
    price: 168000,
    stock: 13,
    isbn: "9781982137274",
    description:
      "Seven principles for personal and professional effectiveness, moving from self-mastery to working well with others.",
  },
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    category: "Self-Help",
    price: 215000,
    stock: 4,
    isbn: "9780374533557",
    description:
      "A Nobel-winning psychologist explains the two systems that drive how we think and the predictable mistakes they lead us to.",
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self-Help",
    price: 189000,
    stock: 35,
    isbn: "9780735211292",
    description:
      "A step-by-step method for building good habits and breaking bad ones through small changes that add up over time.",
  },
  {
    title: "Rich Dad Poor Dad",
    author: "Robert T. Kiyosaki",
    category: "Business & Economics",
    price: 115000,
    stock: 19,
    isbn: "9781612680194",
    description:
      "The author compares the money lessons of his two father figures and argues for financial education, assets and investing.",
  },
  {
    title: "The Lean Startup",
    author: "Eric Ries",
    category: "Business & Economics",
    price: 198000,
    stock: 8,
    isbn: "9780307887894",
    description:
      "How new businesses can test ideas quickly, measure what customers really do and change direction before running out of money.",
  },
  {
    title: "Zero to One",
    author: "Peter Thiel",
    category: "Business & Economics",
    price: 165000,
    stock: 0,
    isbn: "9780804139298",
    description:
      "An entrepreneur argues that the most valuable companies create something new instead of copying what already works.",
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    category: "History & Science",
    price: 149000,
    stock: 10,
    isbn: "9780553380163",
    description:
      "An accessible tour of the universe, from the Big Bang and black holes to the nature of time, written for readers without a science background.",
  },
  {
    title: "Guns, Germs, and Steel",
    author: "Jared Diamond",
    category: "History & Science",
    price: 235000,
    stock: 3,
    isbn: "9780393317558",
    description:
      "Why did some societies come to dominate others? The author looks at geography, farming and disease for the answer.",
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    category: "History & Science",
    price: 245000,
    stock: 17,
    isbn: "9780062316097",
    description:
      "A sweeping history of our species, from early humans in Africa through the farming and scientific revolutions to the present day.",
  },
  {
    title: "Homo Deus: A Brief History of Tomorrow",
    author: "Yuval Noah Harari",
    category: "History & Science",
    price: 245000,
    stock: 6,
    isbn: "9780062464316",
    description:
      "After famine, plague and war, what will humanity aim for next? The author explores possible futures shaped by data and technology.",
  },
  {
    title: "The Diary of a Young Girl",
    author: "Anne Frank",
    category: "Biography & Memoir",
    price: 99000,
    stock: 12,
    isbn: "9780553296983",
    description:
      "The diary a Jewish teenager kept while hiding with her family in Amsterdam during the Second World War.",
  },
  {
    title: "Steve Jobs",
    author: "Walter Isaacson",
    category: "Biography & Memoir",
    price: 285000,
    stock: 5,
    isbn: "9781451648539",
    description:
      "A biography of the Apple co-founder based on many interviews with him, his family, friends, colleagues and rivals.",
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Technology",
    price: 450000,
    stock: 7,
    isbn: "9780132350884",
    description:
      "Guidelines and worked examples for writing code that is easy to read, test and change, from naming to functions to error handling.",
  },
  {
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt",
    category: "Technology",
    price: 420000,
    stock: 9,
    isbn: "9780135957059",
    description:
      "Practical tips on the habits and attitudes of effective software developers, from managing knowledge to automating everyday work.",
  },
];

/** Distinct author names, in first-appearance order. */
export const AUTHORS: string[] = [...new Set(BOOKS.map((book) => book.author))];

/** Timestamp for the i-th book (oldest first, one day apart). */
export function seedCreatedAt(index: number): string {
  const base = new Date(SEED_BASE_DATE).getTime();
  return new Date(base + index * 24 * 60 * 60 * 1000).toISOString();
}
