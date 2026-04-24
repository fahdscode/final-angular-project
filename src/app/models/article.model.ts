export interface Article {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleFormValue {
  title: string;
  content: string;
}