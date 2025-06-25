import React, { Suspense } from 'react';
import { BaseSectionRendererProps, SectionConfig } from './types';
import { LoadingSpinner } from './loading-spinner';
import { SectionProps } from '../user/types';

interface GenericSectionRendererProps<TProps = SectionProps> extends BaseSectionRendererProps {
  sections?: SectionConfig[];
  sectionComponentMap?: Record<string, React.ComponentType<TProps>>;
  defaultSection?: string;
}

export const GenericSectionRenderer = <TProps = SectionProps>({
  activeSection,
  userDetails,
  setActiveSection,
  sections = [],
  sectionComponentMap = {},
  defaultSection = "overview",
  ...otherProps
}: GenericSectionRendererProps<TProps> ) => {
  // Find the active section either in sections array or use the component map
  const sectionConfig = sections.find(section => section.id === activeSection) || 
                        sections.find(section => section.id === defaultSection);
  if(userDetails === null) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-medium text-gray-700">Please log in</h3>
        <p className="mt-2 text-gray-500">You need to be logged in to access this section.</p>
      </div>
    );
  }
  // Determine the component to render
  let ComponentToRender;
  
  if (sectionConfig?.component) {
    // Use the component from the section config if available
    ComponentToRender = sectionConfig.component;
  } else if (sectionComponentMap[activeSection]) {
    // Otherwise try to find it in the component map
    ComponentToRender = sectionComponentMap[activeSection];
  } else if (sectionComponentMap[defaultSection]) {
    // Fall back to default section
    ComponentToRender = sectionComponentMap[defaultSection];
  } else {
    // No component found
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-medium text-gray-700">Section not implemented</h3>
        <p className="mt-2 text-gray-500">This section is currently under development.</p>
      </div>
    );
  }
  
  // Pass all props to the section component
  return (
    <Suspense fallback={<div className="py-6"><LoadingSpinner /></div>}>
      <ComponentToRender 
        userDetails={userDetails} 
        setActiveSection={setActiveSection} 
        {...otherProps as TProps} 
      />
    </Suspense>
  );
};
