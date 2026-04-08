"""
Authentication middleware for JWT token validation
"""

import json
from typing import Optional, Tuple
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.core.config import settings
from app.core.logging import setup_logger
from app.schemas.auth import TokenData

logger = setup_logger()

class AuthMiddleware(HTTPBearer):
    """
    Authentication middleware for JWT token validation
    """
    
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)
    
    async def __call__(self, request: Request) -> Optional[TokenData]:
        """
        Validate JWT token from request
        
        Args:
            request: FastAPI request object
            
        Returns:
            TokenData if valid, None if public endpoint
            
        Raises:
            HTTPException: If authentication fails
        """
        # Skip auth for public endpoints
        public_paths = [
            "/health",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/docs",
            "/api/redoc",
            "/openapi.json",
            "/favicon.ico",
            "/"
        ]
        
        if request.url.path in public_paths:
            return None
        
        # Check for API key in query parameters
        api_key = request.query_params.get("api_key")
        if api_key:
            return await self._validate_api_key(request, api_key)
        
        # Check for bearer token
        credentials: Optional[HTTPAuthorizationCredentials] = await super().__call__(request)
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        
        if credentials.scheme != "Bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
            )
        
        token = credentials.credentials
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            # Extract token data
            user_id = payload.get("sub")
            tenant_id = payload.get("tenant_id")
            username = payload.get("username")
            email = payload.get("email")
            is_superuser = payload.get("is_superuser", False)
            
            if not all([user_id, tenant_id, username, email]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload",
                )
            
            # Create token data
            token_data = TokenData(
                user_id=int(user_id),
                tenant_id=int(tenant_id),
                username=username,
                email=email,
                is_superuser=is_superuser
            )
            
            # Add tenant context to request state
            request.state.tenant_id = token_data.tenant_id
            request.state.user_id = token_data.user_id
            request.state.user = token_data
            
            return token_data
            
        except JWTError as e:
            logger.error(f"JWT validation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
    
    async def _validate_api_key(self, request: Request, api_key: str) -> TokenData:
        """
        Validate API key
        
        Args:
            request: FastAPI request object
            api_key: API key string
            
        Returns:
            TokenData if valid
            
        Raises:
            HTTPException: If API key is invalid
        """
        # TODO: Implement API key validation against database
        # For now, we'll use a placeholder implementation
        
        # Check if it's a valid API key format (64 chars hex)
        if len(api_key) != 64 or not all(c in "0123456789abcdefABCDEF" for c in api_key):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key format",
            )
        
        # Placeholder: Extract user/tenant from API key
        # In production, this would query the database
        try:
            # Simulate API key lookup
            # This is a placeholder - replace with actual database query
            user_id = 1
            tenant_id = 1
            username = "api_user"
            email = "api@example.com"
            
            token_data = TokenData(
                user_id=user_id,
                tenant_id=tenant_id,
                username=username,
                email=email,
                is_superuser=False
            )
            
            # Add tenant context to request state
            request.state.tenant_id = token_data.tenant_id
            request.state.user_id = token_data.user_id
            request.state.user = token_data
            
            return token_data
            
        except Exception as e:
            logger.error(f"API key validation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key",
            )