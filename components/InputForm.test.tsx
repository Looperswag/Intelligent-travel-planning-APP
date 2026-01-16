import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { InputForm } from './InputForm';
import { AgentStage } from '../types';

describe('InputForm', () => {
  const mockOnGenerate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render input form correctly', () => {
    render(
      <InputForm
        onGenerate={mockOnGenerate}
        isGenerating={false}
        agentStage={AgentStage.IDLE}
      />
    );

    expect(screen.getByPlaceholderText(/比如/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /开始规划/i })).toBeInTheDocument();
  });

  it('should show validation error when prompt is empty', async () => {
    const user = userEvent.setup();
    render(
      <InputForm
        onGenerate={mockOnGenerate}
        isGenerating={false}
        agentStage={AgentStage.IDLE}
      />
    );

    const submitButton = screen.getByRole('button', { name: /开始规划/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/请输入旅行需求/i)).toBeInTheDocument();
    });
  });

  it('should handle text input correctly', async () => {
    const user = userEvent.setup();
    render(
      <InputForm
        onGenerate={mockOnGenerate}
        isGenerating={false}
        agentStage={AgentStage.IDLE}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '北京5日游');

    expect(textarea).toHaveValue('北京5日游');
  });

  it('should disable submit button when generating', () => {
    render(
      <InputForm
        onGenerate={mockOnGenerate}
        isGenerating={true}
        agentStage={AgentStage.PLANNING}
      />
    );

    const submitButton = screen.getByRole('button', { name: /规划中/i });
    expect(submitButton).toBeDisabled();
  });

  it('should call onGenerate with correct data', async () => {
    const user = userEvent.setup();
    render(
      <InputForm
        onGenerate={mockOnGenerate}
        isGenerating={false}
        agentStage={AgentStage.IDLE}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '上海3天2夜');

    const submitButton = screen.getByRole('button', { name: /开始规划/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: '上海3天2夜',
        }),
        expect.any(Array)
      );
    });
  });
});
