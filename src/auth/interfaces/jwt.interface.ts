export interface JwtPayload {
  sub: string | number;
  name: string;
  roles?: Array<string>; // Only for user tokens
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  tenant?: JwtPayload;
}