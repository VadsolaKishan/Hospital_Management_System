import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    return (
        <nav className="flex items-center text-sm text-muted-foreground mb-4 animate-fade-in">
            <Link
                to="/dashboard"
                className="flex items-center hover:text-primary transition-colors"
            >
                <Home className="h-4 w-4 mr-1" />
                <span className="sr-only">Dashboard</span>
            </Link>
            {pathnames.length > 0 && (
                <span className="mx-2">
                    <ChevronRight className="h-4 w-4" />
                </span>
            )}
            {pathnames.map((value, index) => {
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                const displayName = value.charAt(0).toUpperCase() + value.slice(1);

                return (
                    <div key={to} className="flex items-center">
                        {isLast ? (
                            <span className="font-medium text-foreground">{displayName}</span>
                        ) : (
                            <Link
                                to={to}
                                className="hover:text-primary transition-colors"
                            >
                                {displayName}
                            </Link>
                        )}
                        {!isLast && (
                            <span className="mx-2">
                                <ChevronRight className="h-4 w-4" />
                            </span>
                        )}
                    </div>
                );
            })}
        </nav>
    );
};
