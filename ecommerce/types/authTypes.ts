export type IUserType = {
    email: string;
    password: string;
    name?: string;
    phone?: string;
  };


  export type ILoggedUserData = {
    email: string;
    password: string;
  }
  export type ILoggedUserResponse = {
    id:string
    email: string;
    name: string;
  }
  