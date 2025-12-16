export type IUserType = {
    email: string;
    password: string;
    name?: string;
    phone?: string;
  };


  export type ILoggedUserData = {
    email: string;
    password: string;
    rememberMe?: boolean;
  }
  export type ILoggedUserResponse = {
    id:string
    email: string;
    name: string;
  }
  