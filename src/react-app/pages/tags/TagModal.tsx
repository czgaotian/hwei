import React, { useEffect, useState, useCallback } from "react";
import { Modal, Form, Input, ColorPicker, message } from "antd";
import type { Tag, CreateTagInput, UpdateTagInput } from "@frontend/api/tags";
import { Color } from "antd/es/color-picker";

interface TagModalProps {
  visible: boolean;
  mode: "create" | "edit";
  tag?: Tag | null;
  onCancel: () => void;
  onSuccess: () => void;
  onSubmit: (data: CreateTagInput | UpdateTagInput) => Promise<void>;
}

// 预设颜色（rendering-hoist-jsx）
const PRESET_COLORS = [
  "#eb2f96", // magenta
  "#f5222d", // red
  "#fa541c", // volcano
  "#fa8c16", // orange
  "#faad14", // gold
  "#a0d911", // lime
  "#52c41a", // green
  "#13c2c2", // cyan
  "#1677ff", // blue
  "#2f54eb", // geekblue
  "#722ed1", // purple
] as const;

const TagModal: React.FC<TagModalProps> = ({
  visible,
  mode,
  tag,
  onCancel,
  onSuccess,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 根据 mode 和 tag 动态计算初始值
  const initialValues = React.useMemo(() => {
    if (mode === "edit" && tag) {
      return {
        name: tag.name,
        color: tag.color,
      };
    }
    return {
      name: "",
      color: "#52c41a", // 默认绿色
    };
  }, [mode, tag]);

  // 当 Modal 打开时，重置 hasChanges 状态
  useEffect(() => {
    if (visible) {
      setHasChanges(false);
    }
  }, [visible]);

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

      message.success(mode === "create" ? "标签创建成功" : "标签更新成功");
      form.resetFields();
      setHasChanges(false);
      onSuccess();
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errorFields" in error) {
        // 表单验证错误，不需要额外处理
        return;
      }

      const errorMessage =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
          ? String(error.response.data)
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
          form.resetFields();
          setHasChanges(false);
          onCancel();
        },
      });
    } else {
      form.resetFields();
      onCancel();
    }
  }, [hasChanges, form, onCancel]);

  const handleValuesChange = useCallback(() => {
    setHasChanges(true);
  }, []);

  return (
    <Modal
      title={mode === "create" ? "新建标签" : "编辑标签"}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={480}
      okText="确定"
      cancelText="取消"
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        initialValues={initialValues}
        preserve={false}
      >
        <Form.Item
          name="name"
          label="标签名称"
          rules={[
            { required: true, message: "请输入标签名称" },
            { max: 50, message: "标签名称不能超过50个字符" },
            {
              pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/,
              message: "标签名称只能包含中文、英文、数字、下划线和连字符",
            },
          ]}
        >
          <Input placeholder="请输入标签名称" maxLength={50} />
        </Form.Item>

        <Form.Item
          name="color"
          label="标签颜色"
          rules={[{ required: true, message: "请选择标签颜色" }]}
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

export default TagModal;
