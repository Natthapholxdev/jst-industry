import React from 'react';

export default function EmployeeProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-indigo-50/30">
      <main>
        {children}
      </main>
    </div>
  );
}