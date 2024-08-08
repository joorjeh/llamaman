// FileTree.tsx
import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { getUserConfig } from './utils';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Box } from '@mui/material';

interface FileNode {
  name: string;
  path: string;
  is_directory: boolean;
  children: FileNode[];
}

const FileTree: React.FC = () => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [workspaceDir, setWorkspaceDir] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileTree = async () => {
      try {
        const config = await getUserConfig();
        const fileTree = await invoke('get_file_tree', { pathString: config.workspace_dir });
        setFileTree(fileTree as FileNode[]);
        setWorkspaceDir(config.workspace_dir);
      } catch (err) {
        setError('Failed to load file tree.');
      }
    };

    fetchFileTree();
  }, []);

  const renderTree = (nodes: FileNode[]): JSX.Element => (
    <SimpleTreeView sx={{
        textTransform: 'none',
    }}>
      {nodes.map((node, index) => {
        if (node.is_directory) {
          return <TreeItem key={index} itemId={node.path} label={node.name}>
            {node.children.length > 0 && renderTree(node.children)}
          </TreeItem>
        } else {
          return <TreeItem key={index} itemId={node.path} label={node.name} />
        }
      })
      }
    </SimpleTreeView>
  );

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <>
      {fileTree ? (
        <SimpleTreeView>
          {renderTree(fileTree)}
        </SimpleTreeView>
      ) : (
        <Box>
          Loading...
        </Box>
      )}
    </>
  );
};

export default FileTree;
