import React, { useEffect, useState, useCallback } from "react";
import { Modal, Form, Input, ColorPicker, message } from "antd";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@frontend/api/categories";
import type { Color } from "antd/es/color-picker";

interface CategoryModalProps {
  visible: boolean;
  mode: "create" | "edit";
  category?: Category | null;
  onCancel: () => void;
  onSuccess: () => void;
  onSubmit: (data: CreateCategoryInput | UpdateCategoryInput) => Promise<void>;
}

// 预设颜色（rendering-hoist-jsx）
const PRESET_COLORS = [
  "#1890FF", // 蓝色
  "#52C41A", // 绿色
  "#FA8C16", // 橙色
  "#F5222D", // 红色
  "#722ED1", // 紫色
  "#13C2C2", // 青色
  "#EB2F96", // 洋红
  "#FAAD14", // 黄色
] as const;

// 默认表单值（rendering-hoist-jsx）
const DEFAULT_FORM_VALUES = {
  name: "",
  color: "#1890FF",
} as const;

const CategoryModal: React.FC<CategoryModalProps> = ({
  visible,
  mode,
  category,
  onCancel,
  onSuccess,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 当 Modal 打开时，同步表单值
  useEffect(() => {
    if (visible) {
      if (mode === "edit" && category) {
        form.setFieldsValue({
          name: category.name,
          color: category.color,
        });
      } else {
        form.setFieldsValue(DEFAULT_FORM_VALUES);
      }
      setHasChanges(false);
    }
  }, [visible, mode, category, form]);

  const handleOk = useCallback(async () => {
    try {
      const values = await form.validateFields();

      // 处理颜色值
      let colorValue = values.color;
      if (typeof colorValue === "object" && colorValue !== null) {
        colorValue = (colorValue as Color).toHexString();
      }

      setLoading(true);
      await onSubmit({
        name: values.name,
        color: colorValue,
      });

      message.success(mode === "create" ? "分类创建成功" : "分类更新成功");
      setHasChanges(false);
      onSuccess();
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errorFields" in error) {
        // 表单验证错误，不需要额外处理
        return;
      }

      // 简化错误处理
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "object" &&
              error !== null &&
              "response" in error &&
              typeof (error as { response?: { data?: unknown } }).response
                ?.data === "string"
            ? (error as { response: { data: string } }).response.data
            : "操作失败";

      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [form, mode, onSubmit, onSuccess]);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      Modal.confirm({
        title: "确定要放弃当前编辑吗？",
        content: "未保存的修改将会丢失",
        okText: "确定",
        cancelText: "取消",
        onOk: () => {
          setHasChanges(false);
          onCancel();
        },
      });
    } else {
      onCancel();
    }
  }, [hasChanges, onCancel]);

  const handleValuesChange = useCallback(() => {
    setHasChanges(true);
  }, []);

  return (
    <Modal
      title={mode === "create" ? "新建分类" : "编辑分类"}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={480}
      okText="确定"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
        <Form.Item
          name="name"
          label="分类名称"
          rules={[
            { required: true, message: "请输入分类名称" },
            { max: 50, message: "分类名称不能超过50个字符" },
            {
              pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/,
              message: "分类名称只能包含中文、英文、数字、下划线和连字符",
            },
          ]}
        >
          <Input placeholder="请输入分类名称" maxLength={50} />
        </Form.Item>

        <Form.Item
          name="color"
          label="分类颜色"
          rules={[{ required: true, message: "请选择分类颜色" }]}
        >
          <ColorPicker
            presets={[
              {
                label: "推荐颜色",
                colors: PRESET_COLORS as unknown as string[],
              },
            ]}
            showText
            format="hex"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CategoryModal;
