import { useState, useEffect } from 'react';
import { Building2, Search } from 'lucide-react';
import { PageLoader } from '@/components/common/Loader';
import { doctorService, Department } from '@/services/doctorService';
import { toast } from '@/hooks/use-toast';

export const DepartmentList = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const data = await doctorService.getDepartments();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load departments',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Departments</h1>
          <p className="text-muted-foreground">Manage hospital departments</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search departments..."
            className="input-field pl-12 bg-background/50 focus:bg-background transition-all"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDepartments.length > 0 ? (
          filteredDepartments.map((dept) => (
            <div
              key={dept.id}
              className="glass-card rounded-2xl p-6 card-hover group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{dept.name}</h3>
                  <p className="text-xs text-primary font-medium">Department</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {dept.description}
              </p>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No departments found
          </div>
        )}
      </div>
    </div>
  );
};
