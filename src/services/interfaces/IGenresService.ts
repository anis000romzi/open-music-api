export interface Genre {
  id: string;
  name: string;
}

export interface IGenresService {
  getGenres(): Promise<Genre[]>;
}
